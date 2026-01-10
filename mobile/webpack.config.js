const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const vueTransformer = require('../tools/vue-ts-transform');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const config = {
    entry: {
        chat: [__dirname + '/chat.ts', __dirname + '/index.html']
    },
    output: {
        path: __dirname + '/www',
        filename: '[name].js'
    },
    context: __dirname,
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/],
                    configFile: __dirname + '/tsconfig.json',
                    transpileOnly: true,
                    getCustomTransformers: () => ({before: [vueTransformer]})
                }
            },
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
                test: /\.(eot|ttf|woff2?|svg)(\?.*)?$/,
                type: 'asset/resource'
            },
            {
                test: /(?<!\.vue)\.scss/,
                use: [
                    {loader: 'css-loader', options: {esModule: false}},
                    'sass-loader'
                ]
            },
            {
                test: /\.vue\.scss/,
                use: [
                    'vue-style-loader',
                    {loader: 'css-loader', options: {esModule: false}},
                    'sass-loader'
                ]
            },
            {
                test: /\.vue\.css/,
                use: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}}]
            },
        ]
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            async: false,
            typescript: {
                configFile: path.join(__dirname, 'tsconfig.json')
            }
        }),
        new VueLoaderPlugin(),
        new NodePolyfillPlugin()
    ],
    resolve: {
        alias: {
            vue$: path.resolve(__dirname, 'vue-shim.js')
        },
        fallback: {
            fs: false,
            tls: false,
            net: false
        },
        'extensions': ['.ts', '.js', '.vue', '.scss']
    }
};

module.exports = function(mode) {
    if(mode === 'production') {
        process.env.NODE_ENV = 'production';
        config.devtool = 'source-map';
    } else {
        config.devtool = false;
    }
    return config;
};
