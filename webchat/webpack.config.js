const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const vueTransformer = require('../tools/vue-ts-transform');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const config = {
    entry: __dirname + '/chat.ts',
    output: {
        path: __dirname + '/dist'
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
                test: /sw\.js$/,
                type: 'asset/resource',
                generator: {filename: 'sw.js'}
            },
            {
                test: /\.(eot|ttf|woff2?|svg)(\?.*)?$/,
                type: 'asset/resource'
            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    {loader: 'css-loader', options: {esModule: false}},
                    'sass-loader'
                ]
            },
            {test: /\.css$/, use: ['vue-style-loader', {loader: 'css-loader', options: {esModule: false}}]},
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
