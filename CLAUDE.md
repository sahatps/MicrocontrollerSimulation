# HackCable — CLAUDE.md

## Project Overview

**HackCable** is an Arduino/ESP32 simulator that lets users wire electronic components visually and emulate code. It is a TypeScript + Webpack + Babel project with two main parts:

- `src/` — the reusable library (bundled as `dist/bundle.js`)
- `web/` — the demo web app that exercises the library

## Architecture

| Layer | Technology |
|-------|-----------|
| UI / Wiring canvas | [Draw2D](http://www.draw2d.org) |
| Component visuals | [Wokwi Elements](https://github.com/wokwi/wokwi-elements) |
| Arduino emulation | [AVR8JS](https://github.com/wokwi/avr8js) |
| ESP32 C++ compilation | Browser-side `clang-llvm` via self-hosted `/wasm-clang` assets |
| Frontend build | Webpack 5 + Babel + TypeScript |
| Internationalization | i18next (`src/ui/i18n/`) |

## Dev Servers

| Server | Port | Start command |
|--------|------|---------------|
| Webpack dev server (web app) | 3000 | `npm run serve:web` |
| Lightweight backend/static server | 3001 | `npm run serve:backend` |
| Both together | — | `npm run dev` |

Access the app at **http://localhost:3000**

The webpack dev server proxies `/api` to `http://localhost:3001`.

The webpack dev server serves `/wasm-clang` directly from `web/wasm-clang/`.

## Key npm Scripts

```bash
npm run dev             # Start both servers concurrently (recommended for development)
npm run serve:web       # Webpack dev server only
npm run serve:backend   # Node.js Emscripten backend only
npm run build:web       # Production build of the web app
npm run build:src       # Production build of the library
npm run build:all       # web + bfarm + copy bfarm dist
npm run type-check      # TypeScript type checking (no emit)
```

## Source Layout

```
src/
  components/       # Custom component element definitions (TypeScript)
  emulator/         # AVR8JS compiler / manager
  panels/           # Catalog and component panels
  ui/               # i18n, stylus styles, UI utilities
  main.ts           # Library entry point

web/
  index.ts          # Web app entry point
  index.html        # App HTML template
  shell.html        # Dev server shell (served at /)
  arduino-headers.ts
  arduino-wasm-shim.ts
  clang-runner.ts
  wasm-clang/       # Self-hosted Clang/LLVM WASM toolchain assets

server.js           # Express backend for health/static routes (port 3001)
webpack.config.js           # Library bundle config
webpack.config.web.js       # Web app bundle config
```

## Important Notes

- **Class name preservation**: TerserPlugin is configured with `keep_classnames: true` and `keep_fnames: true` — do not remove this; component detection uses `instanceof` checks that rely on stable class names.
- **Cross-Origin headers**: The dev server sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` so browser-side `wasm-clang` can use `SharedArrayBuffer`.
- The `bfarm/` subdirectory has its own `package.json` and build step (`npm run build:bfarm`).

## Branch Convention

- `main` — stable/production branch
- Feature branches prefixed with `feat/`
- Current active branch: `feat/godbolt-emscripten`
