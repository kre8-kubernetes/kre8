const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');
// Config directories
const SRC_DIR = path.resolve(__dirname, 'src/client');
const OUTPUT_DIR = path.resolve(__dirname, 'dist');
// Any directories you will be adding code/files into, need to be
// added to this array so webpack will pick them up
const defaultInclude = [SRC_DIR];

module.exports = {
  mode: 'production',
  entry: `${SRC_DIR}/index.js`,
  output: {
    path: OUTPUT_DIR,
    publicPath: './',
    filename: 'bundle.js',

  },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ],
        include: defaultInclude,
      },
      {
        test: /\.(js|jsx)$/,
        use: [{ loader: 'babel-loader' }],
        include: defaultInclude,
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        use: [{ loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]' }],
        include: defaultInclude,
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [{ loader: 'file-loader?name=font/[name]__[hash:base64:5].[ext]' }],
        include: defaultInclude,
      },
    ],
  },
  target: 'electron-renderer',
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/main/index.html',
      inject: 'body',
    }),
    // new webpack.DefinePlugin({
    //   'process.env.NODE_ENV': JSON.stringify('development'),
    // }),
  ],
  devtool: 'cheap-source-map',
};
