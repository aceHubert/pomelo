import type { RollupOptions } from 'rollup';
import type { PostCSSPluginConf } from 'rollup-plugin-postcss';

export interface IBuilderConfig {
  externals?: Record<string, string>;
  //当前仓库核心依赖的三方组件库名称
  targetLibName?: string;
  //核心三方库cjs目录名
  targetLibCjsDir?: string;
  //核心三方库es目录名
  targetLibEsDir?: string;
  //是否打包全量类型文件
  bundleDts?: boolean;
  // output 文件名, default: package.json name
  filename?: string;
  rootStyle?:
    | false
    | {
        // golb pattern, default: ./**/*/style.{ts,js}
        pattern?: string;
        // output file name, default: style.ts
        dist?: string;
        // root path, default: ./src
        root?: string;
      };
  //样式文件编译配置
  postcssOptions?: Omit<PostCSSPluginConf, 'extract' | 'use'> & {
    use?: { [key in 'sass' | 'stylus' | 'less']?: any };
  };
  //额外的Rollup配置
  rollupOptions?: RollupOptions[];
}
