import type { IBuilderConfig } from '../../scripts/build/types';

export const BuilderConfig: IBuilderConfig = {
  targetLibName: 'ant-design-vue',
  targetLibCjsDir: 'lib',
  targetLibEsDir: 'es',
  externals: {
    'ant-design-vue/lib': 'antd',
  },
  style: {
    input: ['src/style.ts', 'src/styles/index.ts'],
    use: {
      less: {
        modifyVars: {
          'root-entry-name': 'default',
          hack: 'true;@import "./src/styles/themes/index.less";',
        },
      },
    },
  },
};
