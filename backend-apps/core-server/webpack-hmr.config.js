const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');

module.exports = function (options) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    devtool: 'inline-source-map',
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100', 'utils/configuration.utils'],
        modulesFromFile: true,
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
      new RunScriptWebpackPlugin({
        name: options.output.filename,
        autoRestart: false,
        nodeArgs: ['--inspect=0.0.0.0:9229'],
      }),
    ],
  };
};
