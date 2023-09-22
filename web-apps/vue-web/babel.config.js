module.exports = (api) => ({
  presets: [
    'vca-jsx',
    [
      '@vue/cli-plugin-babel/preset',
      {
        // https://github.com/vuejs/jsx-vue2/issues/181
        // jsx: {
        //   compositionAPI: true,
        // },
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
        },
        // caller.target will be the same as the target option from webpack
        targets: api.caller((caller) => caller && caller.target === 'node')
          ? { node: 'current' }
          : { chrome: '58', ie: '9' },
      },
    ],
  ],
  plugins: [
    [
      'import',
      {
        libraryName: 'ant-design-vue',
        libraryDirectory: 'es',
        style: true,
      },
      'ant-design-vue',
    ],
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
});
