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

export class ClangCancelledError extends Error {
    constructor(message = 'Clang operation cancelled') {
        super(message);
        this.name = 'ClangCancelledError';
    }
}

export function isClangCancellation(error: unknown): boolean {
    if (error instanceof ClangCancelledError) return true;
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (error instanceof Error) {
        return error.name === 'AbortError' || error.name === 'ClangCancelledError';
    }
    return false;
}

export interface ClangCompileResult {
    wasmBytes: Uint8Array;
    stderr: string;
}

export class ClangWasmRunner {
    private worker: Worker | null = null;
    private workerUrl: string | null = null;
    private nextId = 0;
    private pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
    private activeAbortController: AbortController | null = null;

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
    async load(onProgress?: ProgressCallback, signal?: AbortSignal): Promise<void> {
        if (this.worker) return;

        const controller = new AbortController();
        this.activeAbortController = controller;
        const onExternalAbort = () => controller.abort();
        signal?.addEventListener('abort', onExternalAbort, { once: true });

        const cache = await caches.open(CACHE_NAME);
        try {
            this.throwIfCancelled(controller.signal);
            for (const file of BINARY_FILES) {
                const url = BASE_URL + file;
                if (await cache.match(url)) {
                    this.throwIfCancelled(controller.signal);
                    onProgress?.(1, 1, `${file} (cached)`);
                    continue;
                }
                await this.downloadToCache(cache, url, file, onProgress, controller.signal);
            }

            this.throwIfCancelled(controller.signal);
            this.worker = this.createWorker();
            await this.call('init');  // waits for API.ready (sysroot untar, memfs init)
            this.throwIfCancelled(controller.signal);
        } catch (error) {
            this.dispose(isClangCancellation(error) ? new ClangCancelledError() : undefined);
            throw isClangCancellation(error) ? new ClangCancelledError() : error;
        } finally {
            signal?.removeEventListener('abort', onExternalAbort);
            if (this.activeAbortController === controller) {
                this.activeAbortController = null;
            }
        }
    }

    /**
     * Compile the given C++ source with injected Arduino headers.
     * Returns a bare wasm32 binary ready for WebAssembly.instantiate().
     */
    async compile(cppSource: string, headers: Record<string, string>): Promise<ClangCompileResult> {
        if (!this.worker) throw new Error('Clang not loaded — call load() first');
        return this.call('compile', { source: cppSource, headers });
    }

    /**
     * Fully release worker memory (important after a compile in low-memory mode).
     */
    cancel(): void {
        this.activeAbortController?.abort();
        this.dispose(new ClangCancelledError());
    }

    dispose(reason?: Error): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        if (this.workerUrl) {
            URL.revokeObjectURL(this.workerUrl);
            this.workerUrl = null;
        }
        if (this.pending.size > 0) {
            const err = reason ?? new Error('Clang worker disposed');
            for (const pending of this.pending.values()) {
                pending.reject(err);
            }
            this.pending.clear();
        }
    }

    // ---- private helpers ----

    private async downloadToCache(
        cache: Cache,
        url: string,
        label: string,
        onProgress?: ProgressCallback,
        signal?: AbortSignal,
    ): Promise<void> {
        this.throwIfCancelled(signal);
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(`Failed to download ${label}: HTTP ${res.status}`);

        const total = parseInt(res.headers.get('content-length') ?? '0', 10);
        if (!res.body) throw new Error(`Failed to download ${label}: response body unavailable`);

        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let loaded = 0;

        try {
            while (true) {
                this.throwIfCancelled(signal);
                const { done, value } = await reader.read();
                if (done || !value) break;
                chunks.push(value);
                loaded += value.length;
                onProgress?.(loaded, total, label);
            }
        } catch (error) {
            try {
                await reader.cancel();
            } catch {
                // Reader may already be closed by the abort.
            }
            throw isClangCancellation(error) ? new ClangCancelledError() : error;
        }

        this.throwIfCancelled(signal);
        const buf = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }

        this.throwIfCancelled(signal);
        await cache.put(url, new Response(buf.buffer, {
            headers: { 'content-length': String(loaded) },
        }));
    }

    private throwIfCancelled(signal?: AbortSignal): void {
        if (signal?.aborted) throw new ClangCancelledError();
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
            const stdFlag = '-std=c++17';
            if (!Array.isArray(api.clangCommonArgs)) {
                api.clangCommonArgs = [];
            }
            if (!api.clangCommonArgs.some((arg) => /^-std=/.test(arg))) {
                api.clangCommonArgs.push(stdFlag);
            }
            return api;
        })();
    }
    return apiPromise;
}

function stripAnsi(value) {
    return String(value || '').replace(/\\x1B(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])/g, '');
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
            const logChunks = [];

            // Capture both API logs and compiler stderr for error reporting.
            const origHostWrite = api.hostWrite.bind(api);
            const origMemfsHostWrite = api.memfs.hostWrite.bind(api.memfs);
            const captureHostWrite = (s) => { logChunks.push(s); origHostWrite(s); };
            const captureMemfsHostWrite = (s) => { logChunks.push(s); origMemfsHostWrite(s); };
            api.hostWrite = captureHostWrite;
            api.memfs.hostWrite = captureMemfsHostWrite;

            // Inject Arduino headers into the existing /include/ directory from
            // sysroot.tar. This directory is already in Clang's -internal-isystem
            // search path, so no clangCommonArgs changes are needed.
            // Use a flag to avoid re-adding files on subsequent compilations
            // (the Worker is reused; calling addFile twice on the same path asserts).
            if (!self._headersInjected) {
                let currentHeader = '';
                try {
                    for (const [name, content] of Object.entries(headers)) {
                        currentHeader = name;
                        const normalizedName = name.replace(/^\\/+/, '');
                        const parts = normalizedName.split('/');
                        let dir = 'include';
                        for (let i = 0; i < parts.length - 1; i++) {
                            dir += '/' + parts[i];
                            try {
                                api.memfs.addDirectory(dir);
                            } catch (_) {
                                // Directory may already exist after sysroot untar or a previous header.
                            }
                        }
                        api.memfs.addFile('include/' + normalizedName, content);
                    }
                } catch (err) {
                    const detail = err && err.message ? err.message : String(err);
                    throw new Error('header injection failed for ' + currentHeader + ': ' + detail);
                }
                self._headersInjected = true;
            }

            // Auto-prepend Arduino.h if the user code does not already include it.
            const patchedSource = source.indexOf('Arduino.h') >= 0
                ? source
                : '#include <Arduino.h>' + String.fromCharCode(10) + source;

            // Helper: build a rich error that includes captured compiler output
            const makeErr = (stage, err) => {
                const rawMessage = err && err.message ? err.message : String(err);
                const rawLog = logChunks.join('');
                const message = stripAnsi(rawMessage).trim();
                const log = stripAnsi(rawLog).trim();
                const details = log && !message.includes(log)
                    ? message + '\\n' + log
                    : message;
                return new Error('[' + stage + '] ' + details);
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
                api.memfs.hostWrite = origMemfsHostWrite;
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
                api.memfs.hostWrite = origMemfsHostWrite;
                throw makeErr('wasm-ld', err);
            }

            const wasmBytes = api.memfs.getFileContents('output.wasm').slice();
            api.hostWrite = origHostWrite;
            api.memfs.hostWrite = origMemfsHostWrite;

            // Transfer wasmBytes.buffer so it is not copied across the
            // MessageChannel (zero-copy for large binaries).
            self.postMessage(
                { id, result: { wasmBytes, stderr: logChunks.join('') } },
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
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        this.workerUrl = workerUrl;

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
