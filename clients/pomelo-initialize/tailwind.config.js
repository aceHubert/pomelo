const baseConfig = require('../../tailwind.base.config');

module.exports = {
  ...baseConfig,
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: ['hidden'],
};
