const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// --- em++ path resolution ---
let emscriptenAvailable = false;
let emscriptenVersion = '';
let resolvedEmpp = '';

function findEmpp() {
    const isWin = process.platform === 'win32';
    const candidates = [
        process.env.EMPP_PATH,
        isWin ? null : 'em++',           // system PATH (Unix)
        isWin ? 'em++.bat' : null,       // system PATH (Windows, if emsdk_env was sourced)
        isWin ? 'E:/emsdk/upstream/emscripten/em++.bat' : null,
        isWin ? 'C:/emsdk/upstream/emscripten/em++.bat' : null,
        path.join(os.homedir(), 'emsdk/upstream/emscripten', isWin ? 'em++.bat' : 'em++'),
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            const out = execSync(`"${candidate}" --version`, { timeout: 10000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
            return { path: candidate, version: out.trim().split('\n')[0] };
        } catch {
            // try next candidate
        }
    }
    return null;
}

// Startup check
const found = findEmpp();
if (found) {
    resolvedEmpp = found.path;
    emscriptenVersion = found.version;
    emscriptenAvailable = true;
    console.log('Emscripten found:', emscriptenVersion);
} else {
    console.warn('='.repeat(60));
    console.warn('WARNING: em++ not found. Emscripten compilation disabled.');
    console.warn('Set EMPP_PATH env var or install Emscripten SDK.');
    console.warn('https://emscripten.org/docs/getting_started/downloads.html');
    console.warn('='.repeat(60));
}

// --- Clang path resolution ---
let clangAvailable = false;
let clangVersion = '';

function findClang() {
    const isWin = process.platform === 'win32';
    const candidates = [
        process.env.CLANG_PATH,
        isWin ? 'clang.exe' : 'clang',
        isWin ? 'C:/Program Files/LLVM/bin/clang.exe' : null,
        isWin ? 'C:/LLVM/bin/clang.exe' : null,
        '/usr/bin/clang',
        '/usr/local/bin/clang',
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            const out = execSync(`"${candidate}" --version`, { timeout: 5000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
            // Verify wasm32 target is supported
            execSync(`"${candidate}" --print-targets 2>&1 || true`, { timeout: 5000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
            return { path: candidate, version: out.trim().split('\n')[0] };
        } catch {
            // try next candidate
        }
    }
    return null;
}

// Startup check for Clang
const foundClang = findClang();
if (foundClang) {
    clangVersion = foundClang.version;
    clangAvailable = true;
    console.log('Clang found:', clangVersion);
} else {
    console.warn('WARNING: clang not found. Native Clang WASM compilation disabled.');
}

// --- Status endpoint ---
app.get('/api/compile/emscripten/status', (req, res) => {
    // Re-check if state was flipped to false by a previous error
    if (!emscriptenAvailable) {
        const found = findEmpp();
        if (found) {
            resolvedEmpp = found.path;
            emscriptenVersion = found.version;
            emscriptenAvailable = true;
            console.log('Emscripten re-validated:', emscriptenVersion);
        }
    }
    res.json({
        available: emscriptenAvailable,
        version: emscriptenVersion,
    });
});

const MAIN_CPP_TEMPLATE = (userCode) => `
#include "Arduino.h"
#include <emscripten.h>

/* ---- USER CODE ---- */
${userCode}
/* ---- END USER CODE ---- */

static void emscripten_loop_step() { loop(); }

int main() {
    setup();
    emscripten_set_main_loop(emscripten_loop_step, 0, 1);
    return 0;
}
`;

app.post('/api/compile/emscripten', async (req, res) => {
    // Early guard: em++ not available
    if (!emscriptenAvailable) {
        return res.status(503).json({
            error: 'Emscripten SDK not available',
            code: 'EMSCRIPTEN_NOT_FOUND',
        });
    }

    const { code } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "code" field' });
    }
    if (code.length > 100 * 1024) {
        return res.status(400).json({ error: 'Code exceeds 100KB limit' });
    }

    // Create isolated temp directory
    const tmpDir = path.join(os.tmpdir(), crypto.randomUUID());

    try {
        fs.mkdirSync(tmpDir, { recursive: true });

        // Write main.cpp with user code wrapped in template
        fs.writeFileSync(path.join(tmpDir, 'main.cpp'), MAIN_CPP_TEMPLATE(code));

        // Copy all mock headers into temp dir (Arduino.h, HandySense.h, MCP23008.h, etc.)
        const mockDir = path.join(__dirname, 'arduino-mock');
        function copyMockDir(src, dest) {
            for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);
                if (entry.isDirectory()) {
                    fs.mkdirSync(destPath, { recursive: true });
                    copyMockDir(srcPath, destPath);
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
            }
        }
        copyMockDir(mockDir, tmpDir);

        // Run em++ compiler
        const emCmd = [
            `"${resolvedEmpp}" -std=c++17`,
            '-I .',
            '-s WASM=1',
            '-s MODULARIZE=1',
            '-s EXPORT_NAME=HackCableModule',
            '-s ASYNCIFY=1',
            '-s ASYNCIFY_IMPORTS=delay',
            '-s EXPORTED_RUNTIME_METHODS=UTF8ToString,ccall,cwrap',
            '-s EXPORTED_FUNCTIONS=_main',
            '-s ALLOW_MEMORY_GROWTH=1',
            '-s ENVIRONMENT=web',
            '-O2',
            '-o output.js',
            'main.cpp'
        ].join(' ');

        await new Promise((resolve, reject) => {
            exec(emCmd, { cwd: tmpDir, timeout: 30000 }, (err, stdout, stderr) => {
                if (err) {
                    reject({ message: stderr || err.message, stderr: stderr });
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });

        // Read compiled output
        const jsGlue = fs.readFileSync(path.join(tmpDir, 'output.js'), 'utf-8');
        const wasmBuf = fs.readFileSync(path.join(tmpDir, 'output.wasm'));
        const wasmBase64 = wasmBuf.toString('base64');

        res.json({ js: jsGlue, wasm: wasmBase64 });

    } catch (err) {
        // Only treat as "compiler not found" for OS-level errors, not C++ compilation errors
        const isNotFound =
            err.code === 'ENOENT' ||
            (err.message && err.message.includes('not recognized as an internal or external command'));

        if (isNotFound) {
            emscriptenAvailable = false;
            res.status(503).json({
                error: 'Emscripten compiler not found',
                code: 'EMSCRIPTEN_NOT_FOUND',
            });
        } else {
            res.status(500).json({
                error: err.message || 'Compilation failed',
                code: 'COMPILE_ERROR',
                stderr: err.stderr || ''
            });
        }
    } finally {
        // Clean up temp directory
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('Failed to clean up temp dir:', tmpDir, e.message);
        }
    }
});

// --- Native Clang WASM endpoints ---
app.get('/api/compile/clang/status', (req, res) => {
    if (!clangAvailable) {
        const found = findClang();
        if (found) {
            clangVersion = found.version;
            clangAvailable = true;
            console.log('Clang re-validated:', clangVersion);
        }
    }
    res.json({
        available: clangAvailable,
        version: clangVersion,
    });
});

app.post('/api/compile/clang', async (req, res) => {
    if (!clangAvailable) {
        return res.status(503).json({
            error: 'Clang not available',
            code: 'CLANG_NOT_FOUND',
        });
    }

    const { code } = req.body;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "code" field' });
    }
    if (code.length > 100 * 1024) {
        return res.status(400).json({ error: 'Code exceeds 100KB limit' });
    }

    const tmpDir = path.join(os.tmpdir(), crypto.randomUUID());

    try {
        fs.mkdirSync(tmpDir, { recursive: true });

        // Write user sketch
        fs.writeFileSync(path.join(tmpDir, 'user_sketch.cpp'), code);

        // Copy simulator_core.cpp into temp dir
        fs.copyFileSync(
            path.join(__dirname, 'simulator_core.cpp'),
            path.join(tmpDir, 'simulator_core.cpp')
        );

        // Copy mock_env/ headers into temp dir
        const mockEnvSrc = path.join(__dirname, 'mock_env');
        const mockEnvDest = path.join(tmpDir, 'mock_env');
        fs.mkdirSync(mockEnvDest, { recursive: true });
        for (const entry of fs.readdirSync(mockEnvSrc)) {
            fs.copyFileSync(path.join(mockEnvSrc, entry), path.join(mockEnvDest, entry));
        }

        // Run clang to compile to wasm32
        const clangPath = findClang().path;
        const clangCmd = [
            `"${clangPath}" --target=wasm32`,
            '-nostdlib',
            '-I./mock_env',
            '-Wl,--no-entry',
            '-Wl,--export=sim_run_setup',
            '-Wl,--export=sim_run_loop',
            '-Wl,--allow-undefined',
            '-o output.wasm',
            'simulator_core.cpp',
            'user_sketch.cpp'
        ].join(' ');

        await new Promise((resolve, reject) => {
            exec(clangCmd, { cwd: tmpDir, timeout: 30000 }, (err, stdout, stderr) => {
                if (err) {
                    reject({ message: stderr || err.message, stderr: stderr, code: err.code });
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });

        const wasmBuf = fs.readFileSync(path.join(tmpDir, 'output.wasm'));
        const wasmBase64 = wasmBuf.toString('base64');

        res.json({ wasm: wasmBase64 });

    } catch (err) {
        const isNotFound =
            err.code === 'ENOENT' ||
            (err.message && err.message.includes('not recognized as an internal or external command'));

        if (isNotFound) {
            clangAvailable = false;
            res.status(503).json({
                error: 'Clang compiler not found',
                code: 'CLANG_NOT_FOUND',
            });
        } else {
            res.status(500).json({
                error: err.message || 'Compilation failed',
                code: 'COMPILE_ERROR',
                stderr: err.stderr || ''
            });
        }
    } finally {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch (e) {
            console.warn('Failed to clean up temp dir:', tmpDir, e.message);
        }
    }
});

app.listen(PORT, () => {
    console.log(`HackCable Emscripten backend running on http://localhost:${PORT}`);
});
