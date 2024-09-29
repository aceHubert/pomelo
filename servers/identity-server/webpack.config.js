const nodeExternals = require('webpack-node-externals');

module.exports = function (options) {
  return {
    ...options,
    // mode: 'production',
    externals: [
      nodeExternals({
        allowlist: ['lru-cache'],
        modulesFromFile: true,
      }),
    ],
    output: {
      filename: 'servers/identity-server/dist/main.js',
    },
  };
};
