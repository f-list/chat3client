const path = require('path');
const fs = require('fs');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const vueTransformer = require('../tools/vue-ts-transform');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { DefinePlugin } = require('webpack');
const packageJson = require('./package.json');
const APP_VERSION = process.env.APP_VERSION || packageJson.version;

const mainConfig = {
    entry: [path.join(__dirname, 'main.ts'), path.join(__dirname, 'package.json')],
    output: {
        path: __dirname + '/app',
        filename: 'main.js'
    },
    context: __dirname,
    target: 'electron-main',
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    configFile: __dirname + '/tsconfig-main.json',
                    transpileOnly: true
                }
            },
            {
                test: /package\.json$/,
                include: path.join(__dirname, 'package.json'),
                type: 'asset/resource',
                generator: {filename: 'package.json'}
            },
            {
                test: /\.(png|html)(\?.*)?$/,
                type: 'asset/resource',
                generator: {filename: '[name][ext]'}
            }
        ]
    },
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
            typescript: {
                configFile: path.join(__dirname, 'tsconfig-main.json')
            }
        }),
        new DefinePlugin({
            'process.env.APP_VERSION': JSON.stringify(APP_VERSION)
        })
    ],
    resolve: {
        extensions: ['.ts', '.js']
    }
}, rendererConfig = {
    entry: {
        chat: path.join(__dirname, 'chat.ts'),
        window: path.join(__dirname, 'window.ts')
    },
    output: {
        path: __dirname + '/app',
        publicPath: './',
        filename: '[name].js'
    },
    context: __dirname,
    target: 'electron-renderer',
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    compilerOptions: {
                        preserveWhitespace: false
                    }
                }
            },
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                    configFile: __dirname + '/tsconfig-renderer.json',
                    transpileOnly: true,
                    getCustomTransformers: () => ({before: [vueTransformer]})
                }
            },
            {
                test: /\.(eot|ttf|woff2?|svg)(\?.*)?$/,
                type: 'asset/resource'
            },
            {
                test: /\.(wav|mp3|ogg)(\?.*)?$/,
                type: 'asset/resource',
                generator: {filename: 'sounds/[name][ext]'}
            },
            {
                test: /\.(png|html)(\?.*)?$/,
                type: 'asset/resource',
                generator: {filename: '[name][ext]'}
            },
            {
                test: /\.vue\.scss/,
                use: [
                    'vue-style-loader',
                    {loader: 'css-loader', options: {esModule: false}},
                    {
                        loader: 'sass-loader',
                        options: {
                            warnRuleAsWarning: false,
                            sassOptions: {
                                quietDeps: true,
                                silenceDeprecations: [
                                    'mixed-decls',
                                    'import',
                                    'color-functions',
                                    'global-builtin',
                                    'slash-div',
                                    'function-units'
                                ],
                                verbose: false
                            }
                        }
                    }
                ]
            },
            {
                test: /\.vue\.css/,
                use: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}}]
            },
            {
                test: /\.scss$/,
                exclude: /\.vue$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {loader: 'css-loader', options: {esModule: false}},
                    {
                        loader: 'sass-loader',
                        options: {
                            warnRuleAsWarning: false,
                            sassOptions: {
                                quietDeps: true,
                                silenceDeprecations: [
                                    'mixed-decls',
                                    'import',
                                    'color-functions',
                                    'global-builtin',
                                    'slash-div',
                                    'function-units'
                                ],
                                verbose: false
                            }
                        }
                    }
                ]
            }
        ]
    },
    node: {
        __dirname: false,
        __filename: false
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
            typescript: {
                configFile: path.join(__dirname, 'tsconfig-renderer.json')
            }
        }),
        new DefinePlugin({
            'process.env.APP_VERSION': JSON.stringify(APP_VERSION)
        }),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '..', 'chat', 'preview', 'assets', '**', '*').replace(/\\/g, '/'),
                    to: path.join('preview', 'assets'),
                    context: path.resolve(__dirname, '..', 'chat', 'preview', 'assets'),
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(__dirname, '..', 'assets', '**', '*').replace(/\\/g, '/'),
                    to: path.join('assets'),
                    context: path.resolve(__dirname, '..', 'assets'),
                    noErrorOnMissing: true
                },
                {
                    from: path.resolve(__dirname, '..', 'chat', 'sound-themes', '**', '*').replace(/\\/g, '/'),
                    to: path.join('sound-themes'),
                    context: path.resolve(__dirname, '..', 'chat', 'sound-themes'),
                    noErrorOnMissing: true
                },
                {
                    from: path.join(__dirname, 'index.html'),
                    to: 'index.html'
                },
                {
                    from: path.join(__dirname, 'window.html'),
                    to: 'window.html'
                },
                {
                    from: path.join(__dirname, 'build', 'tray@2x.png'),
                    to: 'tray@2x.png'
                },
                {
                    from: path.join(__dirname, 'package.json'),
                    to: 'package.json',
                    transform(content) {
                        const json = JSON.parse(content.toString());
                        delete json.build;
                        return JSON.stringify(json, null, 2);
                    }
                }
            ]
        })
    ],
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.css']
    },
    optimization: {
        splitChunks: {chunks: 'all', minChunks: 2, name: 'common'},
        moduleIds: 'named',
        chunkIds: 'named'
    }
};

module.exports = function(mode) {
    const themesDir = path.join(__dirname, '../scss/themes/chat');
    const themes = fs.readdirSync(themesDir);
    const themeEntries = {};
    for(const theme of themes) {
        if(!theme.endsWith('.scss')) continue;
        const absPath = path.join(themesDir, theme);
        const themeName = theme.replace('.scss', '');
        themeEntries[`themes/${themeName}`] = absPath;
    }
    const faPath = path.join(themesDir, '../../fa.scss');
    themeEntries['fa'] = faPath;
    rendererConfig.entry = {
        ...rendererConfig.entry,
        ...themeEntries
    };
    if(mode === 'production') {
        process.env.NODE_ENV = 'production';
        mainConfig.devtool = rendererConfig.devtool = false;
        rendererConfig.optimization = {
            ...rendererConfig.optimization,
            minimizer: ['...', new CssMinimizerPlugin()]
        };
    } else {
        mainConfig.devtool = rendererConfig.devtool = 'inline-source-map';
    }
    return [mainConfig, rendererConfig];
};
