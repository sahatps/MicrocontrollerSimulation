const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack')

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

const appBasePath = normalizeBasePath(process.env.APP_BASE_PATH);
const publicUrl = (pathSuffix) => `${appBasePath}/${pathSuffix.replace(/^\/+/, '')}`;
const blocklyRedirectPath = routeFor(appBasePath, 'blockly');
const localEmailCookieValue = 'local@hackcable.dev';
const localHostnames = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const hasCookie = (req, name) =>
    String(req.headers.cookie || '')
        .split(';')
        .some((cookie) => cookie.trim().split('=')[0] === name);
const isLocalRequest = (req) => localHostnames.has(req.hostname);
const isBlocklyRedirectPath = (req) =>
    req.path === blocklyRedirectPath || req.path.startsWith(`${blocklyRedirectPath}/`);
const rootEntryPaths = new Set([
    normalizeRoutePath(routeFor('', '')),
    normalizeRoutePath(routeFor('', 'index.html')),
    normalizeRoutePath(routeFor(appBasePath, '')),
    normalizeRoutePath(routeFor(appBasePath, 'index.html')),
]);
const isRootEntryRequest = (req) =>
    req.method === 'GET' && rootEntryPaths.has(normalizeRoutePath(req.path));

module.exports = {
    entry: ["@babel/polyfill", path.resolve(__dirname, 'web') + "/index.ts"],
    performance: {
        hints: false
    },
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true
    },
    devServer: {
        host: '0.0.0.0',
        client: {
            overlay: true,
        },
        allowedHosts: 'all',
        compress: true,
        port: 3000,
        static: [
            {
                directory: path.join(__dirname, 'blocks-app/dist'),
                publicPath: publicUrl('blocks')
            },
            {
                directory: path.join(__dirname, 'web/wasm-clang'),
                publicPath: publicUrl('wasm-clang')
            }
        ],
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            // Keeps SharedArrayBuffer available for browser-side wasm-clang.
            'Cross-Origin-Embedder-Policy': 'credentialless'
        },
        onBeforeSetupMiddleware: (devServer) => {
            devServer.app.use((req, res, next) => {
                if (!isBlocklyRedirectPath(req) && isRootEntryRequest(req) && !hasCookie(req, 'email')) {
                    if (isLocalRequest(req)) {
                        res.cookie('email', localEmailCookieValue, {
                            path: '/',
                            sameSite: 'lax',
                        });
                        next();
                        return;
                    }

                    res.redirect(302, blocklyRedirectPath);
                    return;
                }
                next();
            });

            if (appBasePath) {
                devServer.app.use((req, res, next) => {
                    if (req.path === appBasePath) {
                        res.redirect(308, `${appBasePath}/`);
                        return;
                    }
                    next();
                });
            }
            devServer.app.get(`${appBasePath}/`, (_req, res) => {
                res.sendFile(path.join(__dirname, 'web/shell.html'));
            });
        },
        proxy: [
            {
                context: [publicUrl('api')],
                target: 'http://localhost:3001',
                changeOrigin: true,
                ...(appBasePath ? {
                    pathRewrite: { [`^${appBasePath}`]: '' },
                } : {}),
                onError: (err, req, res) => {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Backend server not running',
                        code: 'BACKEND_UNAVAILABLE'
                    }));
                }
            }
        ]
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                exclude: /wasm-clang[\\/]/,
                terserOptions: {
                    compress: {
                        // Drop noisy runtime logs in production builds to reduce
                        // console retention pressure and client memory growth.
                        pure_funcs: ['console.log', 'console.debug', 'console.info'],
                    },
                    keep_classnames: true,
                    keep_fnames: true,
                },
            }),
        ],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/web/hackcable'),
        publicPath: publicUrl('hackcable/'),
        clean: true
    },
    resolve: {
        extensions: ['.ts', '.js', '.json', '.css'],
        fallback: {
            buffer: require.resolve('buffer/'),
            module: false,
            fs: false,
            path: false
        }
    },
    module: {
        rules: [
            { // TS loader
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.styl$/,
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "stylus-loader",
                        options: {
                            webpackImporter: false,
                        },
                    },
                ],
            },
            { // CSS auto injection
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new HtmlWebpackPlugin({ // Auto-inject JS into HTML + copy HTML
            template: "./web/index.html",
            filename: "./index.html"
        }),
        new CopyWebpackPlugin({ // Copy Assets
            patterns: [
                {
                    from: './web/assets',
                    to: 'assets'
                },
                {
                    from: './web/wasm-clang',
                    to: path.resolve(__dirname, 'dist/web/wasm-clang')
                },
                {
                    from: './web/shell.html',
                    to: path.resolve(__dirname, 'dist/web/index.html')
                }
            ]
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            "$": "jquery",
            "jQuery": "jquery",
            "window.jQuery": "jquery"
        }),
        new webpack.DefinePlugin({
            'process.env.APP_BASE_PATH': JSON.stringify(appBasePath),
        }),
    ],
}
