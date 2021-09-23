/**
 * webpack.config.js created on 2021. 09. 21.
 * @author SUSY. oopsteam Development Lab <elvis_su@139.com>
 */
const pkg = require('./package.json');
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const isProduction = process.argv.indexOf('-p') > -1;

const FILENAME = pkg.name + (isProduction ? '.min' : '');
const BANNER = [
  `${FILENAME}.js`,
  `@version ${pkg.version}`,
  `@author ${pkg.author}`,
  `@license ${pkg.license}`,
].join('\n');

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    library: ['VideoEditor'],
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist',
    filename: `${FILENAME}.js`,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/js/'),
      '@css': path.resolve(__dirname, 'src/css/'),
      '@svg': path.resolve(__dirname, 'src/svg/'),
    },
  },
  externals: [
    {
      'tui-code-snippet': {
        commonjs: 'tui-code-snippet',
        commonjs2: 'tui-code-snippet',
        amd: 'tui-code-snippet',
        root: ['tui', 'util'],
      },
      'tui-color-picker': {
        commonjs: 'tui-color-picker',
        commonjs2: 'tui-color-picker',
        amd: 'tui-color-picker',
        root: ['tui', 'colorPicker'],
      },
      fabric: {
        commonjs: ['fabric', 'fabric'],
        commonjs2: ['fabric', 'fabric'],
        amd: 'fabric',
        root: 'fabric',
      },
    },
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        enforce: 'pre',
        options: {
          failOnWarning: false,
          failOnError: false,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader?cacheDirectory',
        options: {
          babelrc: true,
        },
      },
      {
        test: /\.styl$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin(BANNER),
    new MiniCssExtractPlugin({
      filename: `${FILENAME}.css`,
    }),
  ],
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          map: {
            inline: false,
          },
        },
      }),
    ],
  },
  devServer: {
    historyApiFallback: false,
    progress: true,
    inline: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  devtool: 'source-map'
};
