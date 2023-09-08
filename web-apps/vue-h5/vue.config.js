const path = require('path');
const fs = require('fs');
const { defineConfig } = require('@vue/cli-service');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const terser = require('terser');
const getCdnConfig = require('./build.cdn');

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
const publicPath = getEnv('BASE_URL', '/');

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
  transpileDependencies: ['@ace-fetch/*', '@ace-util/*', '@vue-async/*', '@pomelo/*', '@formily-portal/*'],
  chainWebpack: (config) => {
    // https://webpack.js.org/configuration/devtool/#development
    config.when(isEnv('development'), (config) => config.devtool('cheap-source-map'));

    // 拆分打包
    config.when(!isEnv('test'), (config) => {
      // https://webpack.js.org/plugins/split-chunks-plugin/#defaults
      config.optimization.splitChunks({
        chunks: 'all',
        maxInitialRequests: 10, // dev vs pro 分包结果不一致问题
        cacheGroups: {
          vant: {
            name: 'chunk-vant', // split vant into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?vant(.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          formily: {
            name: 'chunk-formily', // split formily into a single package
            priority: 19, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily(.*)|[\\/].submodules[\\/]_?formily-vant[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          portal: {
            name: 'chunk-portal', // split formily-portal into a single package
            priority: 19, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily-portal[\\/]vant(.*)|[\\/].submodules[\\/]_?formily-portal-vant[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
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
          // 开发环境下 formily 使用 src
          ...(!isProd
            ? {
                '@pomelo/theme$': path.resolve(__dirname, '../../packages/pomelo-theme/src'),
                '@pomelo/theme/lib': path.resolve(__dirname, '../../packages/pomelo-theme/src'),
                '@pomelo/shared-web': path.resolve(__dirname, '../../packages/pomelo-shared-web/src'),
                '@formily/vant$': path.resolve(__dirname, '../../.submodules/formily-vant/packages/components/src'),
                '@formily/vant-prototypes/esm': path.resolve(
                  __dirname,
                  '../../.submodules/formily-vant/packages/prototypes/src',
                ),
                '@formily-portal/vant$': path.resolve(
                  __dirname,
                  '../../.submodules/formily-portal-vant/packages/components/src',
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
      postcss: {
        postcssOptions: {
          plugins: [
            [
              'postcss-pxtorem',
              {
                rootValue: 37.5,
                unitPrecision: 3,
                minPixelValue: 3,
                propList: ['*'],
              },
            ],
          ],
        },
      },
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
            hack: 'true;@import "./src/assets/styles/variables.less";',
          },
        },
      },
    },
    // 启用 CSS modules for all css / pre-processor files.
    // requireModuleExtension: true,
  },
});
