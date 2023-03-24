module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      {
        jsx: {
          compositionAPI: true,
        },
      },
    ],
  ],
  plugins: [
    [
      'import',
      {
        libraryName: 'vant',
        libraryDirectory: 'es',
        style: (name) => `${name}/style/less.js`,
      },
      'vant',
    ],
    // [
    //   'import',
    //   {
    //     libraryName: '@formily/vant',
    //     libraryDirectory: 'esm',
    //     style: true,
    //   },
    //   '@formily/vant',
    // ],
    // [
    //   'import',
    //   {
    //     libraryName: '@formily-portal/vant',
    //     libraryDirectory: 'esm',
    //     style: true,
    //   },
    //   '@formily-portal/vant',
    // ],
  ],
};
