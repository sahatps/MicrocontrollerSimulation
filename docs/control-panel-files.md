# Right-Side Control Panel — File Reference

## Structure (HTML)

| File | Lines | Description |
|------|-------|-------------|
| `web/index.html` | 21–100 | Main panel HTML — controlBar, tabs, buttons |

## Logic (TypeScript)

| File | Lines | Handles |
|------|-------|---------|
| `web/index.ts` | 181–189 | Compile, Execute, Stop, Pause, Board select, Compiler mode select |
| `web/index.ts` | 20–55 | Emscripten availability check + compiler-mode toggle |
| `web/index.ts` | 223–260 | Compile button logic — routes to MicroPython or Emscripten |
| `web/index.ts` | 613–615 | Save, Load (restore), Clear All |
| `web/index.ts` | 1129 | Examples select dropdown |
| `web/index.ts` | 1172–1186 | Language (EN/TH), Board select |

## Styling (CSS)

| File | Description |
|------|-------------|
| `web/css/main.styl` | All panel styles — controlBar, buttonBar, tabs, toggle button, etc. |

## Backend Functionality (called by buttons)

| File | Description |
|------|-------------|
| `src/main.ts` | HackCable main class |
| `src/emulator/compiler.ts` | Compile logic (code → hex) |
| `src/emulator/emulator-manager.ts` | Orchestrates Execute, Stop, Pause — manages AVR and MicroPython runners |
| `src/emulator/avr-runner.ts` | AVR (Arduino) emulator runner |
| `src/emulator/micropython-runner.ts` | MicroPython emulator runner |
| `src/emulator/micro-task-scheduler.ts` | Task scheduler used by emulators |

## Compiler Mode Select (dropdown hidden in HTML)

The `compiler-mode` select (in `web/index.html` line 31) switches between two compilation paths:

| Mode | Description | File |
|------|-------------|------|
| `micropython` (default) | MicroPython — runs in-browser via WASM | `src/emulator/micropython-runner.ts` |
| `emscripten` | Emscripten C++ — calls server API `/api/compile/emscripten` | `server.js` (handles API route) |

> Note: Emscripten mode is only available for ESP32 boards and requires the Emscripten SDK installed on the server.
