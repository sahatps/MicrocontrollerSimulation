const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const shouldServeStatic = process.env.SERVE_STATIC === '1';
const PORT = Number(process.env.PORT || (shouldServeStatic ? 3000 : 3001));
const DIST_WEB_DIR = path.join(__dirname, 'dist', 'web');
const normalizeBasePath = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || trimmed === '/') return '';
    return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};
const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASE_PATH);
const routeFor = (basePath, pathSuffix = '') =>
    `${basePath}/${String(pathSuffix).replace(/^\/+/, '')}`;
const routeVariants = (pathSuffix = '') => {
    const routes = [routeFor('', pathSuffix)];
    if (APP_BASE_PATH) routes.push(routeFor(APP_BASE_PATH, pathSuffix));
    return routes;
};
const BLOCKLY_REDIRECT_PATH = '/blockly';
const LOCAL_EMAIL_COOKIE_VALUE = 'local@hackcable.dev';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const hasCookie = (req, name) =>
    String(req.headers.cookie || '')
        .split(';')
        .some((cookie) => cookie.trim().split('=')[0] === name);
const isLocalRequest = (req) => LOCAL_HOSTNAMES.has(req.hostname);
const isBlocklyRedirectPath = (req) =>
    req.path === BLOCKLY_REDIRECT_PATH || req.path.startsWith(`${BLOCKLY_REDIRECT_PATH}/`);
const isPageRequest = (req) =>
    req.method === 'GET' &&
    (req.accepts('html') || req.path === '/' || req.path === APP_BASE_PATH);
const requireEmailCookie = (req, res, next) => {
    if (!isBlocklyRedirectPath(req) && isPageRequest(req) && !hasCookie(req, 'email')) {
        if (isLocalRequest(req)) {
            res.cookie('email', LOCAL_EMAIL_COOKIE_VALUE, {
                path: '/',
                sameSite: 'lax',
            });
            next();
            return;
        }

        res.redirect(302, BLOCKLY_REDIRECT_PATH);
        return;
    }
    next();
};

app.use(cors());
app.use(express.json({ limit: '100kb' }));

if (shouldServeStatic) {
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        next();
    });
}

app.get(routeVariants('health'), (_req, res) => {
    res.json({
        ok: true,
        serveStatic: shouldServeStatic,
        port: PORT,
        compilerMode: 'clang-llvm',
    });
});

if (shouldServeStatic) {
    app.use(requireEmailCookie);

    if (APP_BASE_PATH) {
        app.use((req, res, next) => {
            if (req.path === APP_BASE_PATH) {
                res.redirect(308, `${APP_BASE_PATH}/`);
                return;
            }
            next();
        });
    }

    for (const route of routeVariants()) {
        app.use(route, express.static(DIST_WEB_DIR));
    }

    app.get(routeVariants(), (_req, res) => {
        res.sendFile(path.join(DIST_WEB_DIR, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`HackCable server running on http://localhost:${PORT}${routeFor(APP_BASE_PATH)}`);
});
