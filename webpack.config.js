const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './client/index.js',
  output: {
    path: __dirname + '/client/build',
    filename: 'index.js'
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
    alias: { '@': __dirname + '/client' }
  },
  module: {
    rules: [
      { test: /\.(js|jsx)$/, exclude: /node_modules/, use: ['babel-loader'] },
      { test: /\.(png|jpg|svg)$/, use: ['file-loader'] },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.html$/, use: ['html-loader'] },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './client/index.html',
      filename: 'index.html'
    })
  ]
}