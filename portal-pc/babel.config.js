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
        libraryName: 'ant-design-vue',
        libraryDirectory: 'es',
        style: true,
      },
      'ant-design-vue',
    ],
    // [
    //   'import',
    //   {
    //     libraryName: '@formily/antdv',
    //     libraryDirectory: 'esm',
    //     style: true,
    //   },
    //   '@formily/antdv',
    // ],
    // [
    //   'import',
    //   {
    //     libraryName: '@formily-portal/antdv',
    //     libraryDirectory: 'esm',
    //     style: true,
    //   },
    //   '@formily-portal/antdv',
    // ],
  ],
};
