module.exports = {
  '*.{js?(x),ts?(x),vue}': [
    // TODO: 旧的不检测了 'yarn lint:check',
    'node ./scripts/prettier.js write-changed',
  ],
};
