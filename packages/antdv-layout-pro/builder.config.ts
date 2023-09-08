import type { IBuilderConfig } from '../../scripts/build/types';

export const BuilderConfig: IBuilderConfig = {
  targetLibName: 'ant-design-vue',
  targetLibCjsDir: 'lib',
  targetLibEsDir: 'es',
  externals: {
    'ant-design-vue/lib': 'antd',
  },
  filename: 'index',
  postcssOptions: {
    use: {
      less: {
        modifyVars: {
          'root-entry-name': 'default',
        },
      },
    },
  },
};
