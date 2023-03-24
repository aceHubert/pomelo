module.exports = (api) => {
  return {
    presets: [
      [
        '@vue/cli-plugin-babel/preset',
        {
          jsx: {
            compositionAPI: true,
          },
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
      [
        'import',
        {
          libraryName: 'vant',
          libraryDirectory: 'es',
          style: (name) => `${name}/style/index.js`, // 使用css, 避免与 antdv 变量冲突
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
};
