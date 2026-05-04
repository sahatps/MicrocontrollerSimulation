import json
import re
import subprocess
import threading
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

WORKDIR = Path.cwd()
TARGET_URL = "http://localhost:3000/#circuit"
BROWSER_PATHS = [
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
]

EXAMPLES = [
    ("new_bfarm_smart_greenhouse", "empty_ok"),
    ("new_bfarm_awd_automation", "empty_ok"),
    ("new_bfarm_fertigation_lab", "fertigation_lines"),
    ("new_bfarm_weather_station_sim", "weather_prefix"),
    ("new_bfarm_hybrid_connectivity", "hybrid_periodic"),
]

RUNTIME_ERROR_RE = re.compile(r"Runtime error:|WASM load error:|Error: No compiled WASM|\\[MicroPython Error\\]|\\[MicroPython SyntaxError\\]", re.I)
TERM_PROBLEM_RE = re.compile(r"\b(error|exception|traceback|failed|unhandled)\b", re.I)
TERM_IGNORE_RE = re.compile(r"compiled successfully|compile complete|hot-update|webpack|compiled with warnings", re.I)


def wait_http(url: str, timeout: float = 240.0):
    import urllib.request
    deadline = time.time() + timeout
    last_err = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=3) as resp:
                if resp.status == 200:
                    return
        except Exception as e:
            last_err = e
        time.sleep(1)
    raise TimeoutError(f"Server not reachable at {url}. Last error: {last_err}")


def now_str(ts: float | None = None):
    if ts is None:
        ts = time.time()
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts))


def classify_serial(expectation: str, text: str, snapshots: list[dict]):
    responsive = len(snapshots) >= 2 and all(s.get("exists") for s in snapshots)
    lengths = [s.get("len", 0) for s in snapshots]
    changed = (max(lengths) - min(lengths)) > 0 if lengths else False

    if expectation == "empty_ok":
        ok = True
        note = "Stable-empty output is acceptable"
    elif expectation == "fertigation_lines":
        ok = bool(re.search(r"pH\s*=", text)) and bool(re.search(r"EC\s*=", text)) and bool(re.search(r"Temp\s*=", text))
        note = "Expected periodic pH/EC/Temp serial lines"
    elif expectation == "weather_prefix":
        ok = bool(re.search(r"(^|\n)\s*W:", text))
        note = "Expected periodic serial lines prefixed with W:"
    elif expectation == "hybrid_periodic":
        ok = bool(re.search(r"BT cmd|tick:|\.{2,}|\n\.", text)) and (changed or len(text) > 0)
        note = "Expected periodic serial output (dots/command logs)"
    else:
        ok = False
        note = "Unknown serial expectation"

    if not responsive:
        ok = False
        note += "; serial panel not responsive"

    return ok, note, changed


def terminal_problems(lines: list[str]):
    out = []
    for line in lines:
        if TERM_PROBLEM_RE.search(line) and not TERM_IGNORE_RE.search(line):
            out.append(line)
    return out


def main():
    terminal_log: list[tuple[float, str]] = []

    dev_proc = subprocess.Popen(
        ["cmd", "/c", "npm run dev"],
        cwd=str(WORKDIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )

    def _reader():
        if dev_proc.stdout is None:
            return
        for line in dev_proc.stdout:
            terminal_log.append((time.time(), line.rstrip("\n")))

    t = threading.Thread(target=_reader, daemon=True)
    t.start()

    report = {
        "target": TARGET_URL,
        "started_at": now_str(),
        "results": [],
        "notes": [],
    }

    browser = None
    pw = None

    try:
        wait_http("http://localhost:3000", timeout=240)

        browser_path = next((p for p in BROWSER_PATHS if p.exists()), None)
        if not browser_path:
            raise FileNotFoundError(f"No supported browser found in: {BROWSER_PATHS}")

        pw = sync_playwright().start()
        browser = pw.chromium.launch(executable_path=str(browser_path), headless=True, args=["--disable-gpu"])
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = context.new_page()

        browser_events: list[dict] = []

        def on_console(msg):
            browser_events.append({
                "ts": time.time(),
                "type": "console",
                "level": msg.type,
                "text": msg.text,
            })

        def on_page_error(exc):
            browser_events.append({
                "ts": time.time(),
                "type": "pageerror",
                "level": "error",
                "text": str(exc),
            })

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=120000)
        page.wait_for_selector("#frame-hackcable", timeout=90000)
        frame_handle = page.query_selector("#frame-hackcable")
        if frame_handle is None:
            raise RuntimeError("HackCable iframe not found")
        hc_frame = frame_handle.content_frame()
        if hc_frame is None:
            raise RuntimeError("Could not access HackCable iframe content")
        hc_frame.wait_for_selector("#compile", timeout=90000)

        hc_frame.evaluate("window.confirm = () => true")

        # Baseline state once
        hc_frame.select_option("#board-select", "handysense-pro")
        hc_frame.select_option("#compiler-mode", "micropython")
        page.wait_for_timeout(800)

        for key, expectation in EXAMPLES:
            ex_start = time.time()
            event_start_idx = len(browser_events)

            hc_frame.select_option("#code-examples", key)
            page.wait_for_timeout(400)

            selected_val = hc_frame.eval_on_selector("#code-examples", "el => el.value")
            code_text = hc_frame.eval_on_selector("#code-editor", "el => el.value")
            selected_ok = selected_val == key

            # Compile
            hc_frame.click("#compile")
            compile_text = ""
            compile_deadline = time.time() + 25
            while time.time() < compile_deadline:
                compile_text = hc_frame.eval_on_selector("#status-message", "el => (el.textContent || '').trim()")
                if "Compile complete!" in compile_text or "Compilation failed!" in compile_text:
                    break
                page.wait_for_timeout(250)
            compiled_ok = ("Compile complete!" in compile_text) and ("Compilation failed!" not in compile_text)

            # Execute
            hc_frame.click("#execute")
            page.wait_for_timeout(300)
            io_active = hc_frame.eval_on_selector(".io-panel", "el => el.classList.contains('active')")

            snapshots = []
            observe_start = time.time()
            while time.time() - observe_start < 20:
                snap = hc_frame.evaluate(
                    """() => {
                        const el = document.getElementById('serial-output');
                        if (!el) return { exists: false, len: 0, lines: 0, tail: [] };
                        const text = (el.innerText || el.textContent || '');
                        const lines = text.split(/\\r?\\n/).filter(Boolean);
                        const before = el.scrollTop;
                        el.scrollTop = el.scrollHeight;
                        return {
                            exists: true,
                            len: text.length,
                            lines: lines.length,
                            tail: lines.slice(-5),
                            text,
                            scrollBefore: before,
                            scrollAfter: el.scrollTop,
                            scrollHeight: el.scrollHeight,
                        };
                    }"""
                )
                snapshots.append(snap)
                page.wait_for_timeout(2000)

            final_snap = snapshots[-1] if snapshots else {"exists": False, "text": "", "tail": []}
            serial_text = final_snap.get("text", "")
            runtime_error = bool(RUNTIME_ERROR_RE.search(serial_text))

            # Status after execute
            exec_text = hc_frame.eval_on_selector("#status-message", "el => (el.textContent || '').trim()")
            executed_ok = bool(io_active) and not runtime_error and ("Compilation failed!" not in exec_text)

            serial_ok, serial_note, serial_changed = classify_serial(expectation, serial_text, snapshots)

            # Browser and terminal logs in this example window
            ex_end = time.time()
            ex_events = [e for e in browser_events[event_start_idx:] if e["ts"] >= ex_start and e["ts"] <= ex_end]
            browser_probs = [e for e in ex_events if str(e.get("level", "")).lower() in ("error", "assert") or e.get("type") == "pageerror"]

            ex_term_lines = [line for ts, line in terminal_log if ts >= ex_start and ts <= ex_end]
            term_probs = terminal_problems(ex_term_lines)

            hc_frame.click(".tab-btn[data-tab='code']")
            hc_frame.click("#stop")
            page.wait_for_timeout(600)

            serial_tail = "\n".join((final_snap.get("tail") or [])[-3:])

            passed = all([
                selected_ok,
                compiled_ok,
                executed_ok,
                serial_ok,
                len(browser_probs) == 0,
                len(term_probs) == 0,
            ])

            report["results"].append({
                "example": key,
                "selected": selected_ok,
                "compiled": compiled_ok,
                "compile_status": compile_text or "(no status)",
                "executed": executed_ok,
                "execute_status": exec_text or "(no status)",
                "serial_behavior": {
                    "ok": serial_ok,
                    "note": serial_note,
                    "changed": serial_changed,
                    "length": len(serial_text),
                    "tail": serial_tail,
                },
                "browser_log": {
                    "ok": len(browser_probs) == 0,
                    "problems": browser_probs[:20],
                },
                "terminal_log": {
                    "ok": len(term_probs) == 0,
                    "problems": term_probs[:20],
                },
                "pass": passed,
                "time_window": {
                    "start": now_str(ex_start),
                    "end": now_str(ex_end),
                },
                "code_loaded_marker": ("new Bfarm Test" in code_text),
            })

        report["finished_at"] = now_str()

    finally:
        if browser is not None:
            browser.close()
        if pw is not None:
            pw.stop()

        if dev_proc and dev_proc.poll() is None:
            dev_proc.terminate()
            try:
                dev_proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                dev_proc.kill()

    out_path = WORKDIR / "manual_validation_report_new_bfarm_playwright.json"
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"REPORT_PATH={out_path}")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
