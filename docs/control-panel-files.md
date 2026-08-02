# Right-Side Control Panel - File Reference

## Structure (HTML)

| File | Lines | Description |
|------|-------|-------------|
| `web/index.html` | 21-100 | Main panel HTML - controlBar, tabs, buttons |

## Logic (TypeScript)

| File | Handles |
|------|---------|
| `web/index.ts` | Compile, Execute, Stop, Pause, Board select, Compiler mode select |
| `web/index.ts` | ESP32 compiler visibility and Clang/LLVM compile path |
| `web/index.ts` | Save, Load (restore), Clear All |
| `web/index.ts` | Examples select dropdown |
| `web/index.ts` | Language (EN/TH), Board select |

## Styling (CSS)

| File | Description |
|------|-------------|
| `web/css/main.styl` | All panel styles - controlBar, buttonBar, tabs, toggle button, etc. |

## Backend Functionality (called by buttons)

| File | Description |
|------|-------------|
| `src/main.ts` | HackCable main class |
| `src/emulator/compiler.ts` | Compile logic (code -> hex) |
| `src/emulator/emulator-manager.ts` | Orchestrates Execute, Stop, Pause - manages AVR runtime and shared helpers |
| `src/emulator/avr-runner.ts` | AVR (Arduino) emulator runner |

## Compiler Mode Select

The `compiler-mode` select in `web/index.html` is shown for ESP32-family boards and uses a single compilation path:

| Mode | Description | File |
|------|-------------|------|
| `clang-llvm` (default) | Browser-side Clang/LLVM WASM compile + execute path | `web/clang-runner.ts`, `web/arduino-wasm-shim.ts` |

> Note: the backend remains for app serving and `/wasm-clang` proxying only. Native compile endpoints are intentionally removed in this branch.
