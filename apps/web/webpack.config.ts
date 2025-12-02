const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { Configuration } = require('webpack');

/** @type {Configuration} */
const config = {
  mode: 'production',
  entry: {
    popup: './chrome-extension/popup.tsx',
    background: './chrome-extension/background.ts',
    content: './chrome-extension/content.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'chrome-extension/tsconfig.json',
          },
        },
        exclude: /node_modules/,
      },
      // ✅ THIS IS THE NEW RULE FOR CSS FILES
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": false,
      "os": false,
      "fs": false,
      "url": false,
      "buffer": false,
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'chrome-extension/manifest.json', to: 'manifest.json' },
        { from: 'chrome-extension/popup.html', to: 'popup.html' },
        { from: 'chrome-extension/images', to: 'images' },
        // If you add the CSS file, it's good practice to copy it too,
        // although the loader injects it. This is optional but clean.
        { from: 'chrome-extension/popup.css', to: 'popup.css' },
      ],
    }),
  ],
  node: {
    __dirname: false,
  },
};

module.exports = config;
