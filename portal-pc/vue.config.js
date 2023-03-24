const path = require('path');
const fs = require('fs');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const terser = require('terser');
const getCdnConfig = require('./build.cdn');

// Types
const { defineConfig } = require('@vue/cli-service');

const getEnv = (key, defaultValue) => process.env[key] ?? defaultValue;
const isEnv = (env) => process.env.NODE_ENV === env;

const assetsPath = 'static';
const isProd = isEnv('production');
// dev config
const devHost = getEnv('DEV_HOST', 'localhost');
const devPort = Number(getEnv('DEV_PORT', 3000));
const isMock = getEnv('MOCK') === 'true';
const isProxy = isMock || getEnv('PROXY') === 'true';
const isHttps = getEnv('HTTPS') === 'true';
const proxyTarget = (to = 'http://localhost:5010') =>
  isMock ? `http://${getEnv('MOCK_HOST', 'localhost')}:${getEnv('MOCK_PORT', 3001)}` : to;
// env file
const envJs = (isProxy ? 'env/env.dev.proxy.js' : getEnv('ENV_JS')) || 'env/env.js';
// deploy on windows iis
const webConfigFile = getEnv('WEBCONFIG_FILE');
// public path
const publicPath = getEnv('PUBLIC_PATH', '/');

module.exports = defineConfig({
  publicPath,
  assetsDir: assetsPath,
  productionSourceMap: false,
  devServer: {
    allowedHosts: 'all',
    host: devHost,
    port: devPort,
    server: isHttps
      ? {
          type: 'https',
          options: {
            passphrase: 'localhost',
            pfx: fs.readFileSync(path.resolve(__dirname, 'env/certs/localhost.pfx')),
          },
        }
      : null,
    proxy:
      isProxy && !isProd
        ? {
            '/api': {
              target: proxyTarget(),
              changeOrigin: true,
            },
            '/graphql': {
              target: proxyTarget(),
              changeOrigin: true,
            },
            '/main/action': {
              target: proxyTarget(),
              changeOrigin: true,
            },
          }
        : {},
  },
  transpileDependencies: ['@vue-async/*', '@formily-portal/*'],
  chainWebpack(config) {
    // https://webpack.js.org/configuration/devtool/#development
    config.when(isEnv('development'), (config) => config.devtool('cheap-source-map'));

    // 拆分打包
    config.when(!isEnv('test'), (config) => {
      // https://webpack.js.org/plugins/split-chunks-plugin/#defaults
      config.optimization.splitChunks({
        chunks: 'all',
        maxInitialRequests: 10, // dev vs pro 分包结果不一致问题
        cacheGroups: {
          antdv: {
            name: 'chunk-antdv', // split ant-design-vue into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?ant-design-vue(.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          formily: {
            name: 'chunk-formily', // split formily into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily[\\/]antdv(.*)|[\\/].submodules[\\/]_?formily-antdv[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          portal: {
            name: 'chunk-portal', // split lf-portal into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily-portal[\\/]antdv(.*)|[\\/].submodules[\\/]_?formily-portal-antdv[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial', // only package third parties that are initially dependent
          },
          commons: {
            name: 'chunk-common',
            minChunks: 2, //  minimum common number
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true,
          },
        },
      });

      config.optimization.runtimeChunk('single');
    });
  },
  configureWebpack: (config) => {
    if (process.env.NODE_ENV !== 'test') {
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          // antdv icon 引用全部问题
          '@ant-design/icons/lib/dist$': path.resolve(__dirname, 'src/components/antdv-icons.js'),
          // 开发环境下 formily 使用 src
          ...(!isProd
            ? {
                '@pomelo/shared-web': path.resolve(__dirname, '../shared-web/src'),
                '@formily/antdv$': path.resolve(__dirname, '../.submodules/formily-antdv/packages/components/src'),
                '@formily/antdv-prototypes/esm': path.resolve(
                  __dirname,
                  '../.submodules/formily-antdv/packages/prototypes/src',
                ),
                '@formily-portal/antdv$': path.resolve(
                  __dirname,
                  '../.submodules/formily-portal-antdv/packages/components/src',
                ),
              }
            : {}),
        },
      };

      // copy static files.
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: envJs,
              to: path.join(assetsPath, 'js/env.js'),
              transform: async (content) => (await terser.minify(content.toString())).code,
            },
            webConfigFile && {
              from: webConfigFile,
              to: 'web.config',
            },
          ].filter(Boolean),
        }),
      );

      // inject to index.html.
      config.plugins.push(
        new HtmlWebpackTagsPlugin({
          tags: [path.join(assetsPath, 'js/env.js')],
          hash: (path, hash) => path + '?' + hash,
          append: false,
        }),
      );

      if (isProd) {
        // compress html/js/css files.
        config.plugins.push(
          new CompressionPlugin({
            test: /\.js$|\.html$|.\css/,
            threshold: 10240,
            deleteOriginalAssets: false,
          }),
        );

        // use cdn in production
        const cdnConfig = getCdnConfig();

        config.externals = {
          ...config.externals,
          ...cdnConfig.externals,
        };

        // inject cdn resources to index.html.
        config.plugins.push(
          new HtmlWebpackTagsPlugin({
            links: cdnConfig.links,
            scripts: cdnConfig.scripts,
            publicPath: cdnConfig.cdnRegistry,
            append: false,
          }),
        );

        config.plugins.push(
          new HtmlWebpackTagsPlugin({
            links: cdnConfig.append.links,
            scripts: cdnConfig.append.scripts,
            publicPath: cdnConfig.cdnRegistry,
            append: true,
          }),
        );
      }
    }
  },
  css: {
    // 是否使用css分离插件 ExtractTextPlugin
    extract: true,
    // 开启 CSS source maps?
    sourceMap: false,
    // css预设器配置项
    loaderOptions: {
      css: {
        // 模块定义设置
        modules: {
          auto: true,
          localIdentName: isProd ? '[hash:base64]' : '[path]_[name]_[local]_[hash:base64:5]',
          exportLocalsConvention: 'camelCaseOnly',
        },
      },
      less: {
        lessOptions: {
          javascriptEnabled: true,
          modifyVars: {
            hack: 'true;@import "./src/assets/styles/fn.less";',
          },
        },
      },
    },
    // 启用 CSS modules for all css / pre-processor files.
    // requireModuleExtension: true,
  },
});
