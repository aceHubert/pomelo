import path from 'path';
import { merge } from 'lodash-es';
// import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import multiEntry from '@rollup/plugin-multi-entry';
import json from '@rollup/plugin-json';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import externalGlobals from 'rollup-plugin-external-globals';
import dts from 'rollup-plugin-dts';
import css from 'rollup-plugin-import-css';
import ignoreImport from 'rollup-plugin-ignore-import';
import postcss from 'rollup-plugin-postcss';
import svg from 'rollup-plugin-svg';
import NpmImport from 'less-plugin-npm-import';
import Autoprefix from 'less-plugin-autoprefix';
import CleanCSS from 'less-plugin-clean-css';
import { rollup } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import { paramCase } from 'param-case';
import { pascalCase } from 'pascal-case';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import { cwd, pkg, builderConfigs } from './constants';

// Types
import type { OutputOptions, RollupOptions, WarningHandlerWithDefault } from 'rollup';

const extensions = [...DEFAULT_EXTENSIONS, '.ts', '.tsx'];

const parseName = () => {
  const name = String(pkg?.name || '');
  const scope = paramCase(name.match(/@([^\/]+)\//)?.[1] || '');
  const moduleName = paramCase(name.replace(/@[^\/]+\//, ''));
  const filename = scope ? `${scope}.${moduleName}` : moduleName;
  const rootName = scope ? `${pascalCase(scope)}.${pascalCase(moduleName)}` : pascalCase(moduleName);
  return { name, filename, scope, moduleName, rootName };
};

const buildAll = async (inputs: RollupOptions[]) => {
  for (const input of inputs) {
    const { output, ...options } = input;
    const bundle = await rollup(options);
    await bundle.write(output as OutputOptions);
  }
};

const presets = () => {
  const externals = {
    antd: 'antd',
    vue: 'Vue',
    react: 'React',
    moment: 'moment',
    'react-is': 'ReactIs',
    '@alifd/next': 'Next',
    'react-dom': 'ReactDOM',
    'element-ui': 'Element',
    'ant-design-vue': 'antd',
    vant: 'vant',
    '@ant-design/icons': 'icons',
    ...builderConfigs.externals,
  };
  return [
    // 使用 @babel/preset-typescript
    // typescript({
    //   tsconfig: './tsconfig.build.json',
    //   tsconfigOverride: {
    //     compilerOptions: {
    //       module: 'ESNext',
    //       declaration: false,
    //     },
    //   },
    // }),
    svg(),
    css(),
    json(),
    resolve({
      browser: true,
      extensions,
    }),
    commonjs(),
    babel({
      // https://babeljs.io/docs/en/options#rootMode
      rootMode: 'upward', // 向上级查找 babel.config.js
      exclude: [/\/@babel\//, /\/core-js\//],
      babelHelpers: 'runtime',
      extensions,
    }),
    externalGlobals(externals),
  ];
};

const createEnvPlugin = (env = 'development') => {
  return injectProcessEnv(
    {
      NODE_ENV: env,
    },
    {
      exclude: '**/*.{css,less,sass,scss}',
      verbose: false,
    },
  );
};

export const buildUmd = async () => {
  const { name, filename, moduleName, rootName } = parseName();
  const onwarn: WarningHandlerWithDefault = (warning, warn) => {
    // ignoer 'this' rewrite with 'undefined' warn
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    warn(warning); // this requires Rollup 0.46
  };
  const configs: RollupOptions[] = [
    {
      input: 'src/index.ts',
      output: {
        format: 'umd',
        file: path.resolve(cwd, `dist/${builderConfigs.filename ?? filename}.umd.development.js`),
        name: rootName,
        sourcemap: true,
        exports: 'named',
        amd: {
          id: name,
        },
      },
      external: ['react', 'react-dom', 'react-is'],
      plugins: [
        ignoreImport({
          extensions: ['.scss', '.css', '.less'],
          body: 'export default undefined;',
        }),
        ...presets(),
        createEnvPlugin(),
      ],
      onwarn,
    },
    {
      input:
        builderConfigs.rootStyle !== false
          ? [
              'src/index.ts',
              builderConfigs.rootStyle?.dist
                ? path.join(builderConfigs.rootStyle.root ?? 'src', builderConfigs.rootStyle.dist)
                : 'src/style.ts',
            ]
          : 'src/index.ts',
      output: {
        format: 'umd',
        file: path.resolve(cwd, `dist/${builderConfigs.filename ?? filename}.umd.production.js`),
        name: rootName,
        sourcemap: true,
        exports: 'named',
        amd: {
          id: name,
        },
      },
      external: ['react', 'react-dom', 'react-is'],
      plugins: [
        multiEntry(),
        postcss(
          merge(
            {
              extract: path.resolve(cwd, `dist/${builderConfigs.filename ?? moduleName}.css`),
              minimize: true,
              sourceMap: true,
              use: {
                less: {
                  plugins: [
                    new NpmImport({ prefix: '~' }),
                    new Autoprefix({ browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'] }),
                    new CleanCSS({ compatibility: 'ie9,-properties.merging' }),
                  ],
                  javascriptEnabled: true,
                },
                sass: {},
                stylus: {},
              },
            },
            builderConfigs.postcssOptions ?? {},
          ),
        ),
        ...presets(),
        terser(),
        createEnvPlugin('production'),
      ],
      onwarn,
    },
  ];

  if (builderConfigs.rollupOptions) {
    configs.push(
      ...builderConfigs.rollupOptions.map((config) => ({
        ...config,
        plugins: [...(config.plugins || []), ...presets()],
        onwarn,
      })),
    );
  }

  if (builderConfigs.bundleDts) {
    configs.push(
      {
        input: 'esm/index.d.ts',
        output: {
          format: 'es',
          file: `dist/${filename}.d.ts`,
        },
        plugins: [dts()],
      },
      {
        input: 'esm/index.d.ts',
        output: {
          format: 'es',
          file: `dist/${filename}.all.d.ts`,
        },
        plugins: [
          dts({
            respectExternal: true,
          }),
        ],
      },
    );
  }
  await buildAll(configs);
};
