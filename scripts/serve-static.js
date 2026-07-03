const http = require('http');
const fs = require('fs');
const path = require('path');

const normalizeBasePath = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed || trimmed === '/') return '';
    return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};
const routeFor = (basePath, pathSuffix = '') =>
    `${basePath}/${String(pathSuffix).replace(/^\/+/, '')}`;
const normalizeRoutePath = (value) => {
    const trimmed = String(value || '').replace(/\/index\.html$/, '').replace(/\/+$/, '');
    return trimmed || '';
};
const parseCookies = (cookieHeader) =>
    String(cookieHeader || '')
        .split(';')
        .map((cookie) => cookie.trim().split('='))
        .filter(([name]) => !!name)
        .reduce((acc, [name, value]) => {
            acc[name] = value || '';
            return acc;
        }, {});
const safeJoin = (rootDir, relativePath) => {
    const resolved = path.resolve(rootDir, `.${relativePath}`);
    if (!resolved.startsWith(path.resolve(rootDir))) return null;
    return resolved;
};
const fileExists = (filename) => {
    try {
        return fs.statSync(filename).isFile();
    } catch {
        return false;
    }
};
const directoryExists = (filename) => {
    try {
        return fs.statSync(filename).isDirectory();
    } catch {
        return false;
    }
};
const resolveStaticTarget = (rootDir, requestPath) => {
    const directTarget = safeJoin(rootDir, requestPath === '/' ? '/index.html' : requestPath);
    if (directTarget && fileExists(directTarget)) return directTarget;

    const directoryTarget = safeJoin(rootDir, requestPath);
    if (directoryTarget && directoryExists(directoryTarget)) {
        const indexTarget = path.join(directoryTarget, 'index.html');
        if (fileExists(indexTarget)) return indexTarget;
    }

    const nestedIndexTarget = safeJoin(rootDir, `${requestPath.replace(/\/+$/, '')}/index.html`);
    if (nestedIndexTarget && fileExists(nestedIndexTarget)) return nestedIndexTarget;

    return null;
};
const mimeTypeFor = (filename) => {
    switch (path.extname(filename).toLowerCase()) {
        case '.html': return 'text/html; charset=utf-8';
        case '.js': return 'application/javascript; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.svg': return 'image/svg+xml';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.ico': return 'image/x-icon';
        case '.wasm': return 'application/wasm';
        case '.map': return 'application/json; charset=utf-8';
        default: return 'application/octet-stream';
    }
};

const PORT = Number(process.env.PORT || 3000);
const APP_BASE_PATH = normalizeBasePath(process.env.APP_BASE_PATH);
const DIST_WEB_DIR = path.join(__dirname, '..', 'dist', 'web');
const DIST_DOCS_DIR = path.join(DIST_WEB_DIR, 'docs');
const DOCS_BASE_PATH = APP_BASE_PATH ? routeFor(APP_BASE_PATH, 'docs') : '/simulation/docs';
const BLOCKLY_REDIRECT_PATH = '/blockly';
const LOCAL_EMAIL_COOKIE_VALUE = 'local@hackcable.dev';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const ROOT_ENTRY_PATHS = new Set([
    normalizeRoutePath('/'),
    normalizeRoutePath('/index.html'),
    normalizeRoutePath(routeFor(APP_BASE_PATH, '/')),
    normalizeRoutePath(routeFor(APP_BASE_PATH, '/index.html')),
]);
const SHELL_ROUTES = new Set(
    ['/', '/simulation', APP_BASE_PATH || '/'].map((value) => normalizeRoutePath(value)),
);

const writeHeaders = (res, extraHeaders = {}) => {
    for (const [key, value] of Object.entries({
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
        ...extraHeaders,
    })) {
        res.setHeader(key, value);
    }
};
const sendJson = (res, statusCode, payload) => {
    const body = JSON.stringify(payload);
    writeHeaders(res, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
    });
    res.writeHead(statusCode);
    res.end(body);
};
const sendRedirect = (res, location, statusCode = 308) => {
    writeHeaders(res, { Location: location });
    res.writeHead(statusCode);
    res.end();
};
const sendFile = (res, filename) => {
    if (!fileExists(filename)) {
        writeHeaders(res, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.writeHead(404);
        res.end('Not found');
        return;
    }
    writeHeaders(res, { 'Content-Type': mimeTypeFor(filename) });
    res.writeHead(200);
    fs.createReadStream(filename).pipe(res);
};

http.createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = requestUrl.pathname;
    const normalizedPath = normalizeRoutePath(pathname);
    const cookies = parseCookies(req.headers.cookie);
    const isLocalRequest = LOCAL_HOSTNAMES.has(requestUrl.hostname);
    const isBlocklyPath = pathname === BLOCKLY_REDIRECT_PATH || pathname.startsWith(`${BLOCKLY_REDIRECT_PATH}/`);
    const isRootEntryRequest = req.method === 'GET' && ROOT_ENTRY_PATHS.has(normalizedPath);

    if (pathname === '/health' || (APP_BASE_PATH && pathname === routeFor(APP_BASE_PATH, 'health'))) {
        sendJson(res, 200, {
            ok: true,
            serveStatic: true,
            port: PORT,
            compilerMode: 'clang-llvm',
        });
        return;
    }

    if (!isBlocklyPath && isRootEntryRequest && !cookies.email) {
        if (isLocalRequest) {
            writeHeaders(res, { 'Set-Cookie': `email=${LOCAL_EMAIL_COOKIE_VALUE}; Path=/; SameSite=Lax` });
        } else {
            sendRedirect(res, BLOCKLY_REDIRECT_PATH, 302);
            return;
        }
    }

    if (APP_BASE_PATH && pathname === APP_BASE_PATH) {
        sendRedirect(res, `${APP_BASE_PATH}/`);
        return;
    }

    if (pathname === DOCS_BASE_PATH) {
        sendRedirect(res, `${DOCS_BASE_PATH}/`);
        return;
    }

    if (pathname.startsWith(`${DOCS_BASE_PATH}/`)) {
        const relativeDocsPath = pathname.slice(DOCS_BASE_PATH.length) || '/';
        const docsTarget = resolveStaticTarget(DIST_DOCS_DIR, relativeDocsPath);
        if (docsTarget) {
            sendFile(res, docsTarget);
            return;
        }
    }

    if (SHELL_ROUTES.has(normalizedPath)) {
        sendFile(res, path.join(DIST_WEB_DIR, 'index.html'));
        return;
    }

    const relativeWebPath = APP_BASE_PATH && pathname.startsWith(`${APP_BASE_PATH}/`)
        ? pathname.slice(APP_BASE_PATH.length)
        : pathname;
    const webTarget = resolveStaticTarget(DIST_WEB_DIR, relativeWebPath);
    if (webTarget) {
        sendFile(res, webTarget);
        return;
    }

    writeHeaders(res, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.writeHead(404);
    res.end('Not found');
}).listen(PORT, () => {
    console.log(`HackCable static server running on http://localhost:${PORT}${APP_BASE_PATH || ''}`);
});
