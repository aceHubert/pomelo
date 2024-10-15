const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    // mode: 'production',
    externals: [
      nodeExternals({
        allowlist: [],
        modulesFromFile: true,
      }),
    ],
    output: {
      filename: 'servers/infrastructure-service/dist/main.js',
    },
  };
};
