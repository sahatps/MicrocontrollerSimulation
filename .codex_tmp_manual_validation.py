import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import websocket

WORKDIR = Path.cwd()
TARGET_URL = "http://localhost:3000/hackcable/index.html#circuit"
BROWSER_CANDIDATES = [
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
]
DEBUG_PORT = 9335

EXAMPLES = [
    {
        "key": "new_bfarm_smart_greenhouse",
        "marker": "Smart Greenhouse End-to-End",
        "expectation": "empty_ok",
    },
    {
        "key": "new_bfarm_awd_automation",
        "marker": "Paddy Field AWD Automation",
        "expectation": "empty_ok",
    },
    {
        "key": "new_bfarm_fertigation_lab",
        "marker": "Fertigation Controller Lab",
        "expectation": "fertigation_lines",
    },
    {
        "key": "new_bfarm_weather_station_sim",
        "marker": "Edge Weather Station Simulator",
        "expectation": "weather_prefix",
    },
    {
        "key": "new_bfarm_hybrid_connectivity",
        "marker": "Hybrid Connectivity Testbed",
        "expectation": "hybrid_periodic",
    },
]

RUNTIME_ERROR_RE = re.compile(r"Runtime error:|WASM load error:|Error: No compiled WASM|\\[MicroPython Error\\]|\\[MicroPython SyntaxError\\]", re.I)
TERM_PROBLEM_RE = re.compile(r"\b(error|exception|traceback|failed|unhandled)\b", re.I)
TERM_IGNORE_RE = re.compile(r"compiled successfully|compile complete|hot-update|webpack", re.I)


class CDPClient:
    def __init__(self, ws_url: str):
        self.ws = websocket.create_connection(ws_url, timeout=1, suppress_origin=True)
        self.ws.settimeout(0.5)
        self.next_id = 1
        self.browser_events = []

    def close(self):
        try:
            self.ws.close()
        except Exception:
            pass

    def _record_event(self, msg):
        method = msg.get("method")
        params = msg.get("params", {})
        now = time.time()

        if method == "Runtime.consoleAPICalled":
            args = params.get("args", [])
            parts = []
            for a in args:
                if "value" in a:
                    parts.append(str(a["value"]))
                elif "description" in a:
                    parts.append(str(a["description"]))
                else:
                    parts.append(str(a.get("type", "")))
            text = " ".join(parts).strip()
            self.browser_events.append({
                "ts": now,
                "source": "console",
                "level": params.get("type", "log"),
                "text": text,
            })
        elif method == "Runtime.exceptionThrown":
            details = params.get("exceptionDetails", {})
            text = details.get("text", "")
            exc = details.get("exception", {})
            if isinstance(exc, dict) and exc.get("description"):
                text = (text + " | " + str(exc.get("description"))).strip(" |")
            self.browser_events.append({
                "ts": now,
                "source": "exception",
                "level": "error",
                "text": text,
            })
        elif method == "Log.entryAdded":
            entry = params.get("entry", {})
            self.browser_events.append({
                "ts": now,
                "source": entry.get("source", "log"),
                "level": entry.get("level", "info"),
                "text": entry.get("text", ""),
            })

    def _recv_until_id(self, cmd_id: int, timeout: float):
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                raw = self.ws.recv()
            except websocket.WebSocketTimeoutException:
                continue
            msg = json.loads(raw)
            if "id" in msg and msg["id"] == cmd_id:
                return msg
            if "method" in msg:
                self._record_event(msg)
        raise TimeoutError(f"Timed out waiting for CDP response id={cmd_id}")

    def send(self, method: str, params=None, timeout: float = 20.0):
        if params is None:
            params = {}
        cmd_id = self.next_id
        self.next_id += 1
        self.ws.send(json.dumps({"id": cmd_id, "method": method, "params": params}))
        msg = self._recv_until_id(cmd_id, timeout)
        if "error" in msg:
            raise RuntimeError(f"CDP {method} error: {msg['error']}")
        return msg.get("result", {})

    def evaluate(self, expression: str, await_promise: bool = False):
        res = self.send("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": await_promise,
        })
        if "exceptionDetails" in res:
            raise RuntimeError(f"Runtime.evaluate exception: {res['exceptionDetails']}")
        result = res.get("result", {})
        if "value" in result:
            return result["value"]
        return result.get("description")

    def wait_js(self, predicate_expression: str, timeout: float = 30.0, interval: float = 0.25):
        deadline = time.time() + timeout
        last = None
        while time.time() < deadline:
            try:
                last = self.evaluate(predicate_expression)
            except Exception:
                last = None
            if last:
                return last
            self.pump(interval)
        raise TimeoutError(f"Timed out waiting for JS predicate: {predicate_expression}")

    def pump(self, seconds: float):
        end = time.time() + seconds
        while time.time() < end:
            try:
                raw = self.ws.recv()
            except websocket.WebSocketTimeoutException:
                continue
            msg = json.loads(raw)
            if "method" in msg:
                self._record_event(msg)


def wait_http(url: str, timeout: float = 180.0):
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


def wait_cdp(debug_port: int, timeout: float = 30.0):
    deadline = time.time() + timeout
    last_err = None
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json/version", timeout=2) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("webSocketDebuggerUrl"):
                    return
        except Exception as e:
            last_err = e
        time.sleep(0.5)
    raise TimeoutError(f"CDP not reachable on port {debug_port}. Last error: {last_err}")


def create_tab(debug_port: int, url: str):
    encoded_url = urllib.parse.quote(url, safe=':/#?=&')
    req = urllib.request.Request(
        f"http://127.0.0.1:{debug_port}/json/new?{encoded_url}",
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_status(cdp: CDPClient):
    return cdp.evaluate(
        """(() => {
            const el = document.getElementById('status-message');
            return { text: (el?.textContent || '').trim(), cls: el?.className || '' };
        })()"""
    )


def get_serial_snapshot(cdp: CDPClient):
    return cdp.evaluate(
        """(() => {
            const el = document.getElementById('serial-output');
            if (!el) return {exists:false};
            const text = (el.innerText || el.textContent || '');
            const lines = text.split(/\r?\n/).filter(Boolean);
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
                clientHeight: el.clientHeight,
            };
        })()"""
    )


def assess_serial(expectation: str, serial_text: str, samples):
    responsive = len(samples) >= 2 and all(s.get("exists") for s in samples)
    lengths = [int(s.get("len", 0)) for s in samples if isinstance(s, dict)]
    changed = (max(lengths) - min(lengths)) > 0 if lengths else False

    if expectation == "empty_ok":
        ok = True
        note = "Stable/empty allowed"
    elif expectation == "fertigation_lines":
        ok = bool(re.search(r"pH\s*=", serial_text)) and bool(re.search(r"EC\s*=", serial_text)) and bool(re.search(r"Temp\s*=", serial_text))
        note = "Expect pH/EC/Temp periodic lines"
    elif expectation == "weather_prefix":
        ok = bool(re.search(r"(^|\n)\s*W:", serial_text))
        note = "Expect periodic lines prefixed with W:"
    elif expectation == "hybrid_periodic":
        ok = bool(re.search(r"BT cmd|tick:|\.{2,}|\.", serial_text)) and (changed or len(serial_text) > 0)
        note = "Expect periodic dots/command logs"
    else:
        ok = False
        note = "Unknown expectation"

    if not responsive:
        ok = False
        note += "; serial panel not responsive"

    return ok, note, changed


def summarize_browser_events(events):
    problem_levels = {"error", "exception"}
    problems = [e for e in events if str(e.get("level", "")).lower() in problem_levels]
    return problems


def summarize_terminal_lines(lines):
    problems = []
    for line in lines:
        if TERM_PROBLEM_RE.search(line):
            if TERM_IGNORE_RE.search(line):
                continue
            problems.append(line)
    return problems


def ts_str(ts):
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts))


def main():
    results = []
    terminal_lines = []  # list of (ts, line)
    report = {
        "target": TARGET_URL,
        "started_at": ts_str(time.time()),
        "results": results,
        "notes": [],
    }

    dev_proc = None
    chrome_proc = None
    cdp = None
    tmp_profile_dir = None

    try:
        # Start dev server
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

        def dev_reader():
            assert dev_proc is not None
            if dev_proc.stdout is None:
                return
            for line in dev_proc.stdout:
                terminal_lines.append((time.time(), line.rstrip("\n")))

        t = threading.Thread(target=dev_reader, daemon=True)
        t.start()

        wait_http("http://localhost:3000", timeout=240)

        # Start Chromium browser headless with CDP
        browser_path = next((p for p in BROWSER_CANDIDATES if p.exists()), None)
        if browser_path is None:
            raise FileNotFoundError(f"No browser found in candidates: {BROWSER_CANDIDATES}")

        tmp_profile_dir = tempfile.mkdtemp(prefix="hc-cdp-profile-")
        chrome_proc = subprocess.Popen(
            [
                str(browser_path),
                "--headless",
                "--disable-gpu",
                f"--remote-debugging-port={DEBUG_PORT}",
                f"--user-data-dir={tmp_profile_dir}",
                "--no-first-run",
                "--no-default-browser-check",
                "about:blank",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        wait_cdp(DEBUG_PORT, timeout=30)
        tab = create_tab(DEBUG_PORT, TARGET_URL)
        ws_url = tab["webSocketDebuggerUrl"]

        cdp = CDPClient(ws_url)
        cdp.send("Page.enable")
        cdp.send("Runtime.enable")
        cdp.send("Log.enable")
        cdp.send("Page.navigate", {"url": TARGET_URL})

        # Ensure page is ready
        cdp.wait_js("document.readyState === 'complete' && !!document.getElementById('compile')", timeout=90)
        cdp.wait_js("window.location.hash === '#circuit'", timeout=30)

        # Baseline setup once
        cdp.evaluate("window.confirm = () => true; true")
        baseline = cdp.evaluate(
            """(() => {
                const board = document.getElementById('board-select');
                const compiler = document.getElementById('compiler-mode');
                if (!board || !compiler) return {ok:false, reason:'missing controls'};
                if (board.value !== 'handysense-pro') {
                    board.value = 'handysense-pro';
                    board.dispatchEvent(new Event('change', { bubbles: true }));
                }
                compiler.value = 'micropython';
                compiler.dispatchEvent(new Event('change', { bubbles: true }));
                return {
                    ok: true,
                    board: board.value,
                    compiler: compiler.value,
                    compilerDisplay: getComputedStyle(compiler).display,
                };
            })()"""
        )

        if not baseline.get("ok"):
            raise RuntimeError(f"Baseline setup failed: {baseline}")

        time.sleep(1.5)

        for ex in EXAMPLES:
            key = ex["key"]
            marker = ex["marker"]
            expectation = ex["expectation"]

            example_start = time.time()
            browser_start_idx = len(cdp.browser_events)

            # Select example
            sel_res = cdp.evaluate(
                f"""(() => {{
                    const sel = document.getElementById('code-examples');
                    if (!sel) return {{ok:false, reason:'missing code-examples'}};
                    sel.value = '{key}';
                    sel.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    return {{ok:true, value: sel.value}};
                }})()"""
            )
            if not sel_res.get("ok") or sel_res.get("value") != key:
                raise RuntimeError(f"Could not select example {key}: {sel_res}")

            cdp.wait_js(f"document.getElementById('code-editor') && document.getElementById('code-editor').value.includes('{marker}')", timeout=15)
            time.sleep(0.5)

            # Compile (micropython)
            cdp.evaluate("document.getElementById('compile').click(); true")

            compile_status = None
            compile_deadline = time.time() + 20
            while time.time() < compile_deadline:
                st = get_status(cdp)
                txt = st.get("text", "")
                if "Compile complete!" in txt or "Compilation failed!" in txt:
                    compile_status = st
                    break
                cdp.pump(0.3)

            if compile_status is None:
                compile_status = get_status(cdp)

            compile_text = compile_status.get("text", "")
            compiled_ok = "Compile complete!" in compile_text and "Compilation failed!" not in compile_text

            # Execute
            cdp.evaluate("document.getElementById('execute').click(); true")
            io_active = bool(cdp.wait_js("document.querySelector('.io-panel') && document.querySelector('.io-panel').classList.contains('active')", timeout=10))

            serial_samples = []
            observe_start = time.time()
            while time.time() - observe_start < 20:
                snap = get_serial_snapshot(cdp)
                serial_samples.append(snap)
                cdp.pump(2.0)

            final_snap = serial_samples[-1] if serial_samples else {"exists": False, "text": ""}
            serial_text = final_snap.get("text", "") if isinstance(final_snap, dict) else ""
            runtime_error = bool(RUNTIME_ERROR_RE.search(serial_text))

            # Browser logs for this example window
            browser_slice = [e for e in cdp.browser_events[browser_start_idx:] if e.get("ts", 0) >= example_start]
            browser_problems = summarize_browser_events(browser_slice)

            # Terminal logs for this example window
            example_end = time.time()
            terminal_slice = [line for (ts, line) in terminal_lines if ts >= example_start and ts <= example_end]
            terminal_problems = summarize_terminal_lines(terminal_slice)

            # Execute status
            post_exec_status = get_status(cdp)
            exec_status_text = post_exec_status.get("text", "")
            executed_ok = io_active and not runtime_error and ("Compilation failed!" not in exec_status_text)

            # Serial expectation
            serial_ok, serial_note, serial_changed = assess_serial(expectation, serial_text, serial_samples)

            # Stop before next example
            cdp.evaluate("document.getElementById('stop').click(); true")
            cdp.pump(1.0)

            browser_log_ok = len(browser_problems) == 0
            terminal_log_ok = len(terminal_problems) == 0

            passed = all([
                compiled_ok,
                executed_ok,
                serial_ok,
                browser_log_ok,
                terminal_log_ok,
            ])

            tail = final_snap.get("tail", []) if isinstance(final_snap, dict) else []
            serial_tail = "\\n".join(tail[-3:]) if tail else ""

            results.append({
                "example": key,
                "selected": sel_res.get("value") == key,
                "compile_status": compile_text or "(no status text)",
                "compiled": compiled_ok,
                "execute_status": exec_status_text or "(no status text)",
                "executed": executed_ok,
                "serial_observation": {
                    "ok": serial_ok,
                    "note": serial_note,
                    "changed": serial_changed,
                    "length": len(serial_text),
                    "tail": serial_tail,
                },
                "browser_log_status": {
                    "ok": browser_log_ok,
                    "problems": browser_problems[:20],
                },
                "terminal_log_status": {
                    "ok": terminal_log_ok,
                    "problems": terminal_problems[:20],
                },
                "pass": passed,
                "runtime_error_detected": runtime_error,
                "time_window": {
                    "start": ts_str(example_start),
                    "end": ts_str(example_end),
                },
            })

        # Global startup terminal check (before first example)
        if results:
            first_start = min(time.mktime(time.strptime(r["time_window"]["start"], "%Y-%m-%d %H:%M:%S")) for r in results)
            startup_lines = [line for (ts, line) in terminal_lines if ts < first_start]
            startup_problems = summarize_terminal_lines(startup_lines)
            if startup_problems:
                report["notes"].append({"startup_terminal_problems": startup_problems[:20]})

        report["finished_at"] = ts_str(time.time())

    finally:
        if cdp:
            cdp.close()
        if chrome_proc and chrome_proc.poll() is None:
            chrome_proc.terminate()
            try:
                chrome_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                chrome_proc.kill()

        if dev_proc and dev_proc.poll() is None:
            dev_proc.terminate()
            try:
                dev_proc.wait(timeout=15)
            except subprocess.TimeoutExpired:
                dev_proc.kill()

    out_path = WORKDIR / "manual_validation_report_new_bfarm.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(f"REPORT_PATH={out_path}")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()


