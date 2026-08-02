# HackCable
Arduino and ESP32 simulator (Wire components + emulate code)
Test the library here [https://clementgre.github.io/HackCable/](https://clementgre.github.io/HackCable/)

## Goals

- Offer a graphical interface to wire electronic component to board.
  - Using [Wokwi Elements](https://github.com/wokwi/wokwi-elements) for components definition/display 
  - and [Wokwi Boards](https://github.com/wokwi/wokwi-boards) for ESP32 board definition/display.
  - Using [Draw2D](http://www.draw2d.org) for the wiring system.
- Allow emulating code on these boards
  - Using [AVR8JS](https://github.com/wokwi/avr8js) for emulating the code on Arduino.
  
### Project structure

HackCable is coded in TypeScript, using Webpack + Babel.

The code is using only one npm configuration, but there is two webpack configuration files, and two main folders:
- ``src`` is the code of the library itself
- ``web`` is the website that allow to test the library, and to make an example of use. The ``:web`` tasks allow to use this part of the code, associated with the webpack config : ``webpack.config.web.js``.

# Tasks

TypeScript Type checking and generating

``type-check``

``type-check:watch``

``build:types``

Build the library itself

``build:src``

Build or start the live server of the web page that use the library

``build:web``

``serve:web``

## Docker

This repository can run in Docker for local development, including:
- the web app on `http://localhost:3000`

Start it with:

```bash
docker compose up --build
```

Notes:
- ESP32 compilation is browser-side `clang-llvm` only.
- `/wasm-clang` compiler assets are self-hosted static files in this project.
- Source files are mounted into the container, so code changes on your machine are reflected immediately.
- The first browser compile can take a while because `wasm-clang` downloads its toolchain on first use.

## Easy Sharing

If you want to send this project to someone else in the easiest possible way, use the production Docker image.

Build and run locally:

```bash
docker compose -f docker-compose.prod.yml up --build
```

Then open:

```text
http://localhost:3000/simulation/
```

This production image:
- serves the built web app and self-hosted compiler assets from a single container
- uses a single public port: `3000`
- serves the app under `/simulation` by default
- serves `/simulation/wasm-clang` from the bundled static assets
- does not install native compiler toolchains in the container

If you want to publish it for others:

```bash
docker build -f Dockerfile.prod -t yourname/hackcable:latest .
docker push yourname/hackcable:latest
```

To build the production image at the domain root instead, pass an empty base path:

```bash
docker build -f Dockerfile.prod --build-arg APP_BASE_PATH=/ -t yourname/hackcable:latest .
```

Then they can run:

```bash
docker run --pull always -p 3000:3000 yourname/hackcable:latest
```
