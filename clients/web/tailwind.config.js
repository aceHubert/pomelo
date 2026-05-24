/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  corePlugins: {
    preflight: false,
  },
  content: [
    './src/**/*.{vue,js,jsx,ts,tsx}',
    './signin/**/*.{html,js,jsx,ts,tsx}',
    './signin-silent/**/*.{html,js,jsx,ts,tsx}',
    './signout/**/*.{html,js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--theme-primary)',
        'primary-1': 'var(--theme-primary-1)',
        'primary-2': 'var(--theme-primary-2)',
        'primary-3': 'var(--theme-primary-3)',
        'primary-5': 'var(--theme-primary-5)',
        'primary-7': 'var(--theme-primary-7)',
        surface: 'var(--component-background)',
        body: 'var(--body-background)',
        border: 'var(--color-border-base)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-inverse': 'var(--text-inverse)',
      },
      boxShadow: {
        token: 'var(--shadow-1-down)',
      },
    },
  },
  plugins: [],
};
