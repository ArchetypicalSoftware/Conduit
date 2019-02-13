const path = require('path');

module.exports = {
  entry: './wwwroot/js/test.ts',
  devtool: 'inline-source-map',
  module: {
      rules: [{
          test: /\.ts$/,
          use: [{
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              }
          }],
          exclude: /node_modules/,
      }]
  },
  resolve: {
      extensions: ['.ts', '.js']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './wwwroot/js')
  }
};