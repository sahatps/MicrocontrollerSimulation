const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack')

module.exports = {
    entry: ["@babel/polyfill", path.resolve(__dirname, 'web') + "/index.ts"],
    performance: {
        hints: false
    },
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true
    },
    externals: {
        // Exclude MicroPython from bundling - load it dynamically instead
        '@micropython/micropython-webassembly-pyscript': 'micropythonModule'
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
                directory: path.join(__dirname, 'node_modules/@micropython/micropython-webassembly-pyscript'),
                publicPath: '/hackcable'
            },
            {
                directory: path.join(__dirname, 'blocks-app/dist'),
                publicPath: '/blocks'
            }
        ],
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            // credentialless: allows cross-origin fetches without CORP headers
            // (needed for binji/wasm-clang files from binji.github.io).
            // Still enables SharedArrayBuffer (same as require-corp).
            'Cross-Origin-Embedder-Policy': 'credentialless'
        },
        onBeforeSetupMiddleware: (devServer) => {
            devServer.app.get('/', (req, res) => {
                res.sendFile(path.join(__dirname, 'web/shell.html'));
            });
        },
        proxy: [
            {
                context: ['/api'],
                target: 'http://localhost:3001',
                changeOrigin: true,
                onError: (err, req, res) => {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Backend server not running',
                        code: 'BACKEND_UNAVAILABLE'
                    }));
                }
            },
            {
                context: ['/wasm-clang'],
                target: 'https://binji.github.io',
                changeOrigin: true,
                secure: false,
            }
        ]
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
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
        publicPath: '/hackcable/',
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
                    from: './node_modules/@micropython/micropython-webassembly-pyscript/micropython.wasm',
                    to: 'micropython.wasm'
                },
                {
                    from: './node_modules/@micropython/micropython-webassembly-pyscript/micropython.mjs',
                    to: 'micropython.mjs'
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
        })
    ],
}
