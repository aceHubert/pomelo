const path = require('path');
const fs = require('fs');
const { defineConfig } = require('@vue/cli-service');
const { NormalModuleReplacementPlugin } = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const terser = require('terser');
const CKEditorWebpackPlugin = require('@ckeditor/ckeditor5-dev-webpack-plugin');
const { styles } = require('@ckeditor/ckeditor5-dev-utils');
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
          }
        : {},
  },
  transpileDependencies: [
    'antd-layout-pro',
    '@ace-fetch/*',
    '@ace-util/*',
    '@vue-async/*',
    '@pomelo/*',
    '@formily-portal/*',
    /ckeditor5-[^/\\]+[/\\]src[/\\].+\.js$/,
  ],
  chainWebpack: (config) => {
    // https://webpack.js.org/configuration/devtool/#development
    config.when(isEnv('development'), (config) => config.devtool('cheap-source-map'));

    // ckeditor5
    const svgRule = config.module.rule('svg');
    svgRule.exclude.add(path.join(__dirname, 'node_modules', '@ckeditor'));
    config.module
      .rule('cke-svg')
      .test(/ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/)
      .use('raw-loader')
      .loader('raw-loader');
    config.module
      .rule('cke-css')
      .test(/ckeditor5-[^/\\]+[/\\].+\.css$/)
      .use('postcss-loader')
      .loader('postcss-loader')
      .tap(() => {
        return {
          postcssOptions: styles.getPostCssConfig({
            themeImporter: {
              themePath: require.resolve('@ckeditor/ckeditor5-theme-lark'),
            },
            minify: true,
          }),
        };
      });
    config.module
      .rule('svg')
      .exclude.add(/ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/)
      .add(/ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/);

    // 拆分打包
    config.when(!isEnv('test'), (config) => {
      // https://webpack.js.org/plugins/split-chunks-plugin/#defaults
      config.optimization.splitChunks({
        chunks: 'all',
        maxInitialRequests: 10, // dev vs pro 分包结果不一致问题
        cacheGroups: {
          designer: {
            name: 'chunk-designer', // split ant-design-vue into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@designable[\\/](.*)|[\\/]node_modules[\\/]_?@formily[\\/](designable|prototypes|renderer|setters|settings-form)(.*)|[\\/].submodules[\\/]_?formily-antdv[\\/]packages[\\/](designable|prototypes|renderer|setters|settings-form)[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          antdv: {
            name: 'chunk-antdv', // split ant-design-vue into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?ant-design-vue(.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          'formily-antdv': {
            name: 'chunk-formily-antdv', // split formily antd into a single package
            priority: 19, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily[\\/]antdv(.*)|[\\/].submodules[\\/]_?formily-antdv[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          'portal-antdv': {
            name: 'chunk-formily-antdv', // split portal antd into a single package
            priority: 19, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily-portal[\\/]antdv(.*)|[\\/].submodules[\\/]_?formily-portal-antdv[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          vant: {
            name: 'chunk-vant', // split vant into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?vant(.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          'formily-vant': {
            name: 'chunk-formily-vant', // split formily vant into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily[\\/]vant(.*)|[\\/].submodules[\\/]_?formily-vant[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          'portal-vant': {
            name: 'chunk-formily-vant', // split portal vant into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@formily-portal[\\/]vant(.*)|[\\/].submodules[\\/]_?formily-portal-vant[\\/]packages[\\/]components[\\/](.*)/, // in order to adapt to cnpm
            chunks: 'all',
          },
          ckeidtor: {
            name: 'chunk-ckeditor5', // split vant into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?@ckeditor[\\/]ckeditor5(.*)/, // in order to adapt to cnpm
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
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // antdv icon 引用全部问题
        '@ant-design/icons/lib/dist$': path.resolve(__dirname, 'src/components/antdv-icons.js'),
        // ckeditor 多个 build editor 编译问题
        // https://ckeditor.com/docs/ckeditor5/latest/support/error-codes.html#error-ckeditor-duplicated-modules
        '@ckeditor/ckeditor5-build-balloon': path.resolve(__dirname, 'src/components/ckeditor/balloon-editor.ts'),
        '@ckeditor/ckeditor5-build-decoupled-document': path.resolve(
          __dirname,
          'src/components/ckeditor/decoupled-editor.ts',
        ),
        // 开发环境下 formily designable 使用 src
        ...(!isProd
          ? {
              '@pomelo/shared-web': path.resolve(__dirname, '../../packages/shared-web/src'),
              '@formily/antdv$': path.resolve(__dirname, '../../.submodules/formily-antdv/packages/components/src'),
              '@formily/antdv/esm': path.resolve(__dirname, '../../.submodules/formily-antdv/packages/components/src'),
              '@formily/antdv-designable': path.resolve(
                __dirname,
                '../../.submodules/formily-antdv/packages/designable/src',
              ),
              '@formily/antdv-prototypes': path.resolve(
                __dirname,
                '../../.submodules/formily-antdv/packages/prototypes/src',
              ),
              '@formily/antdv-renderer': path.resolve(
                __dirname,
                '../../.submodules/formily-antdv/packages/renderer/src',
              ),
              '@formily/antdv-setters': path.resolve(__dirname, '../../.submodules/formily-antdv/packages/setters/src'),
              '@formily/antdv-settings-form': path.resolve(
                __dirname,
                '../../.submodules/formily-antdv/packages/settings-form/src',
              ),
              '@formily/vant$': path.resolve(__dirname, '../../.submodules/formily-vant/packages/components/src'),
              '@formily/vant/esm': path.resolve(__dirname, '../../.submodules/formily-vant/packages/components/src'),
              '@formily/vant-prototypes': path.resolve(
                __dirname,
                '../../.submodules/formily-vant/packages/prototypes/src',
              ),
              '@formily-portal/antdv$': path.resolve(
                __dirname,
                '../../.submodules/formily-portal-antdv/packages/components/src',
              ),
              '@formily-portal/antdv/esm': path.resolve(
                __dirname,
                '../../.submodules/formily-portal-antdv/packages/components/src',
              ),
              '@formily-portal/antdv-prototypes': path.resolve(
                __dirname,
                '../../.submodules/formily-portal-antdv/packages/prototypes/src',
              ),
              '@formily-portal/vant$': path.resolve(
                __dirname,
                '../../.submodules/formily-portal-vant/packages/components/src',
              ),
              '@formily-portal/vant/esm': path.resolve(
                __dirname,
                '../../.submodules/formily-portal-vant/packages/components/src',
              ),
              '@formily-portal/vant-prototypes': path.resolve(
                __dirname,
                '../../.submodules/formily-portal-vant/packages/prototypes/src',
              ),
            }
          : {}),
      },
    };

    // ckeditor5
    config.plugins.push(
      new CKEditorWebpackPlugin({
        // UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
        // When changing the built-in language, remember to also change it in the editor's configuration (src/ckeditor.js).
        language: 'en',
        additionalLanguages: ['zh-cn'],
        translationsOutputFile: path.join(assetsPath, 'ckeditor5/translations.js'),
        // buildAllTranslationsToSeparateFiles: true,
        // addMainLanguageTranslationsToAllAssets: true,
      }),
    );

    if (process.env.NODE_ENV !== 'test') {
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

      config.plugins.push(
        new HtmlWebpackTagsPlugin({
          tags: [path.join(assetsPath, 'ckeditor5/translations.js')],
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

        // ignore external css files
        const resourceRegExp = new RegExp(`(${Object.keys(cdnConfig.externals).join('|')})\\/[\\w\\W]+\\.css$`);
        config.plugins.push(
          new NormalModuleReplacementPlugin(resourceRegExp, (result) => {
            result.request = result.request.replace(
              result.request.split('!').find((item) => resourceRegExp.test(item)),
              path.resolve(__dirname, 'webpack.empty.css'),
            );
          }),
        );

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
            hack: 'true;@import "./src/assets/styles/variables.less";',
          },
        },
      },
    },
    // 启用 CSS modules for all css / pre-processor files.
    // requireModuleExtension: true,
  },
});
