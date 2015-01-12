var webpack = require("webpack");
var path = require('path');

module.exports = {
  entry: './lib/text-buffer.js',

  output: {
    filename: 'dist/text-buffer.js'
  },

  module: {
    loaders: [
      { test: /\.coffee$/, loader: "coffee" },
    ]
  },

  resolve: {
    root: [],
    extensions: ["", ".coffee", ".js"]
  }
}
