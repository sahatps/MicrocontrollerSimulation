/**
 * ClangWasmRunner — compiles Arduino/ESP32 C++ entirely in-browser using
 * binji/wasm-clang (Clang 10 + LLD compiled to WASI WebAssembly).
 *
 * Architecture:
 *  - A Blob Web Worker loads binji/wasm-clang's shared.js via importScripts()
 *  - The Worker uses the `API` class to drive compilation (compile → link)
 *  - Large binary files (clang, lld, memfs, sysroot.tar) are pre-downloaded
 *    by the main thread with progress callbacks, stored in the Cache API.
 *  - On subsequent visits the Worker reads exclusively from the Cache API
 *    (zero network requests).
 *
 * Output: a bare wasm32-unknown-unknown binary with only the Arduino API as
 * imports — ready for WebAssembly.instantiate() with an ArduinoWasmShim.
 *
 * References:
 *   https://github.com/binji/wasm-clang
 *   https://binji.github.io/wasm-clang/
 */

const BASE_URL  = '/wasm-clang/';
const CACHE_NAME = 'hackcable-clang-v5';

// Files pre-downloaded by the main thread and read by the Worker from cache.
// shared.js is intentionally excluded here — it is loaded via importScripts()
// inside the Worker on every init (it is small ~80KB and quick to fetch once
// COEP: credentialless is active).
const BINARY_FILES = ['clang', 'lld', 'memfs', 'sysroot.tar'] as const;

export type ProgressCallback = (loaded: number, total: number, label?: string) => void;

export interface ClangCompileResult {
    wasmBytes: Uint8Array;
    stderr: string;
}

export class ClangWasmRunner {
    private worker: Worker | null = null;
    private nextId = 0;
    private pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

    /** Returns true if the main clang binary is already in the browser Cache API. */
    async isCached(): Promise<boolean> {
        try {
            const cache = await caches.open(CACHE_NAME);
            return !!(await cache.match(BASE_URL + 'clang'));
        } catch {
            return false;
        }
    }

    /**
     * Pre-download all required binary files (with progress), then create and
     * initialise the Web Worker. Safe to call multiple times.
     */
    async load(onProgress?: ProgressCallback): Promise<void> {
        if (this.worker) return;

        const cache = await caches.open(CACHE_NAME);
        for (const file of BINARY_FILES) {
            const url = BASE_URL + file;
            if (await cache.match(url)) {
                onProgress?.(1, 1, `${file} (cached)`);
                continue;
            }
            await this.downloadToCache(cache, url, file, onProgress);
        }

        this.worker = this.createWorker();
        await this.call('init');  // waits for API.ready (sysroot untar, memfs init)
    }

    /**
     * Compile the given C++ source with injected Arduino headers.
     * Returns a bare wasm32 binary ready for WebAssembly.instantiate().
     */
    async compile(cppSource: string, headers: Record<string, string>): Promise<ClangCompileResult> {
        if (!this.worker) throw new Error('Clang not loaded — call load() first');
        return this.call('compile', { source: cppSource, headers });
    }

    // ---- private helpers ----

    private async downloadToCache(
        cache: Cache,
        url: string,
        label: string,
        onProgress?: ProgressCallback,
    ): Promise<void> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to download ${label}: HTTP ${res.status}`);

        const total = parseInt(res.headers.get('content-length') ?? '0', 10);
        const reader = res.body!.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            chunks.push(value);
            loaded += value.length;
            onProgress?.(loaded, total, label);
        }

        const buf = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }

        await cache.put(url, new Response(buf.buffer, {
            headers: { 'content-length': String(loaded) },
        }));
    }

    private createWorker(): Worker {
        // Inline worker code embedded as a template literal.
        //
        // The Worker:
        //  1. Uses importScripts() to load binji/wasm-clang's shared.js (defines API class).
        //     Requires COEP: credentialless on the parent page.
        //  2. Reads all large binary files from the Cache API (pre-populated above).
        //  3. Creates an `API` instance and waits for it to be ready.
        //  4. On 'compile' messages: injects Arduino headers into MemFS, patches
        //     clangCommonArgs to prioritise /arduino-inc/, compiles to an object
        //     file, then links with bare wasm32 flags (no stdlib).
        const workerCode = `
'use strict';

// binji/wasm-clang shared.js defines the global API, App, MemFS, Tar classes.
// importScripts works from Blob Workers when COEP: credentialless is active.
importScripts('${location.origin + BASE_URL}shared.js');

const BASE      = '${location.origin + BASE_URL}';
const CACHE_NAME = '${CACHE_NAME}';

async function readCached(filename) {
    const cache = await caches.open(CACHE_NAME);
    const url   = BASE + filename;
    const hit   = await cache.match(url);
    if (!hit) throw new Error('File not in cache: ' + url + ' — call load() first.');
    return hit.arrayBuffer();
}

let apiPromise = null;
function getApi() {
    if (!apiPromise) {
        apiPromise = (async () => {
            const api = new API({
                readBuffer:      readCached,
                compileStreaming: async (fn) => WebAssembly.compile(await readCached(fn)),
                hostWrite:       (s) => self.postMessage({ type: 'log', data: s }),
                clang:    'clang',
                lld:      'lld',
                memfs:    'memfs',
                sysroot:  'sysroot.tar',
            });
            await api.ready;
            return api;
        })();
    }
    return apiPromise;
}

self.onmessage = async (event) => {
    const { id, type, payload } = event.data;
    try {
        const api = await getApi();

        // ── init ──────────────────────────────────────────────────────────────
        if (type === 'init') {
            self.postMessage({ id, result: 'ok' });
            return;
        }

        // ── compile ───────────────────────────────────────────────────────────
        if (type === 'compile') {
            const { source, headers } = payload;
            const logLines = [];

            // Capture hostWrite for error reporting
            const origHostWrite = api.hostWrite.bind(api);
            api.hostWrite = (s) => { logLines.push(s); origHostWrite(s); };

            // Inject Arduino headers into the existing /include/ directory from
            // sysroot.tar. This directory is already in Clang's -internal-isystem
            // search path, so no clangCommonArgs changes are needed.
            // Use a flag to avoid re-adding files on subsequent compilations
            // (the Worker is reused; calling addFile twice on the same path asserts).
            if (!self._headersInjected) {
                for (const [name, content] of Object.entries(headers)) {
                    api.memfs.addFile('/include/' + name, content);
                }
                self._headersInjected = true;
            }

            // Auto-prepend Arduino.h if the user code does not already include it.
            const patchedSource = source.indexOf('Arduino.h') >= 0
                ? source
                : '#include <Arduino.h>' + String.fromCharCode(10) + source;

            // Helper: build a rich error that includes captured compiler output
            const makeErr = (stage, err) => {
                const log = logLines.join('\\n');
                return new Error('[' + stage + '] ' + (err.message || String(err)) + (log ? '\\n' + log : ''));
            };

            // Step 1: compile C++ → object file
            try {
                await api.compile({
                    input:    'input.cpp',
                    contents: patchedSource,
                    obj:      'input.o',
                });
            } catch (err) {
                api.hostWrite = origHostWrite;
                throw makeErr('clang', err);
            }

            // Step 2: link → bare wasm32 binary.
            //  --no-entry          : no _start / main required
            //  --allow-undefined   : unresolved symbols become WASM imports
            //  --export=setup/loop : simulation entry points
            try {
                const lldMod = await api.getModule('lld');
                await api.run(lldMod, 'wasm-ld',
                    '--no-entry',
                    '--allow-undefined',
                    '--export=setup',
                    '--export=loop',
                    'input.o',
                    '-o', 'output.wasm',
                );
            } catch (err) {
                api.hostWrite = origHostWrite;
                throw makeErr('wasm-ld', err);
            }

            const wasmBytes = api.memfs.getFileContents('output.wasm').slice();
            api.hostWrite = origHostWrite;

            // Transfer wasmBytes.buffer so it is not copied across the
            // MessageChannel (zero-copy for large binaries).
            self.postMessage(
                { id, result: { wasmBytes, stderr: logLines.join('\\n') } },
                [wasmBytes.buffer],
            );
            return;
        }

        self.postMessage({ id, result: null });
    } catch (e) {
        self.postMessage({ id, error: e.message || String(e) });
    }
};
`;
        const blob   = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.addEventListener('message', (e: MessageEvent) => {
            if (e.data.type === 'log') {
                console.debug('[clang-worker]', e.data.data);
                return;
            }
            const { id, result, error } = e.data;
            const cb = this.pending.get(id);
            if (!cb) return;
            this.pending.delete(id);
            if (error !== undefined) cb.reject(new Error(error));
            else cb.resolve(result);
        });

        return worker;
    }

    private call(type: string, payload?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            this.pending.set(id, { resolve, reject });
            this.worker!.postMessage({ id, type, payload });
        });
    }
}
