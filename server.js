const express = require('express');
const cors = require('cors');
const path = require('path');
const { Readable } = require('stream');

const app = express();
const shouldServeStatic = process.env.SERVE_STATIC === '1';
const PORT = Number(process.env.PORT || (shouldServeStatic ? 3000 : 3001));
const DIST_WEB_DIR = path.join(__dirname, 'dist', 'web');
const WASM_CLANG_ORIGIN = 'https://binji.github.io';
const normalizeBasePath = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || trimmed === '/') return '';
    return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};
const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASE_PATH);
const publicRoute = (pathSuffix = '') =>
    `${APP_BASE_PATH}/${String(pathSuffix).replace(/^\/+/, '')}`;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

if (shouldServeStatic) {
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        next();
    });
}

app.get(publicRoute('health'), (_req, res) => {
    res.json({
        ok: true,
        serveStatic: shouldServeStatic,
        port: PORT,
        compilerMode: 'clang-llvm',
    });
});

if (shouldServeStatic) {
    app.use(publicRoute('wasm-clang'), async (req, res) => {
        const targetUrl = new URL(`/wasm-clang${req.url}`, WASM_CLANG_ORIGIN);
        const controller = new AbortController();
        const onClose = () => controller.abort();
        req.on('close', onClose);

        try {
            const upstream = await fetch(targetUrl, {
                method: req.method,
                signal: controller.signal,
            });

            res.status(upstream.status);
            for (const [key, value] of upstream.headers.entries()) {
                if (key.toLowerCase() === 'transfer-encoding') continue;
                res.setHeader(key, value);
            }

            if (!upstream.body) {
                res.end();
                return;
            }

            Readable.fromWeb(upstream.body).pipe(res);
        } catch (error) {
            if (!res.headersSent) {
                res.status(502).json({
                    error: 'Failed to fetch wasm-clang assets',
                    code: 'WASM_CLANG_PROXY_ERROR',
                    details: error.message || String(error),
                });
            } else {
                res.end();
            }
        } finally {
            req.off('close', onClose);
        }
    });

    if (APP_BASE_PATH) {
        app.use((req, res, next) => {
            if (req.path === APP_BASE_PATH) {
                res.redirect(308, `${APP_BASE_PATH}/`);
                return;
            }
            next();
        });
    }

    app.use(publicRoute(), express.static(DIST_WEB_DIR));

    app.get(publicRoute(), (_req, res) => {
        res.sendFile(path.join(DIST_WEB_DIR, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`HackCable server running on http://localhost:${PORT}${publicRoute()}`);
});
