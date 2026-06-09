const baseConfig = require('../../tailwind.base.config');

module.exports = {
  ...baseConfig,
  content: [
    './src/**/*.{vue,js,jsx,ts,tsx}',
    './signin/**/*.{html,js,jsx,ts,tsx}',
    './signin-silent/**/*.{html,js,jsx,ts,tsx}',
    './signout/**/*.{html,js,jsx,ts,tsx}',
  ],
};
