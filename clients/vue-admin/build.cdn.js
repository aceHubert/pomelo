/**
 * 通过 cdn 加载资源
 * 文档：https://github.com/jharris4/html-webpack-tags-plugin
 */

const fs = require('fs');
const resolve = require('resolve');

const cdnConfig = {
  publicPath: '//unpkg.com',
  links: [
    {
      packageName: 'jsoneditor',
      path: '/dist/jsoneditor.min.css',
      rel: 'stylesheet',
    },
    {
      packageName: 'mavon-editor',
      path: '/dist/css/index.css',
      rel: 'stylesheet',
    },
    {
      packageName: 'quill',
      path: ['/dist/quill.core.css', '/dist/quill.snow.css', '/dist/quill.bubble.css'],
      rel: 'stylesheet',
    },
  ],
  scripts: [
    {
      // 通过 packageName 从 node_modules 获取版本并拼接上registey path
      packageName: 'vue',
      // 通过 variableName 设置 the webpack config's externals  { packageName: variableName }
      // variableName: 'Vue', // use cdn-compatible.js instead
      path: '/dist/vue.runtime.min.js',
    },
    {
      packageName: '@vue/composition-api',
      variableName: 'VueCompositionAPI',
      path: '/dist/vue-composition-api.prod.js',
    },
    {
      packageName: 'vue-demi',
      variableName: 'VueDemi',
      path: '/lib/index.iife.js',
    },
    // 以上包依赖 window.Vue, 在变成 Vue2 前引用
    {
      packageName: 'vue',
      // vue-meta/vue-router ... 遇到 window.Vue 时会主动 install
      // https://qiankun.umijs.org/zh/faq#vue-router-%E6%8A%A5%E9%94%99-uncaught-typeerror-cannot-redefine-property-router
      variableName: 'Vue2',
      path: '/static/js/cdn-compatible.js',
      publicPath: (path, publicPath) => publicPath + path,
      hash: true,
      version: false,
    },
    {
      packageName: 'vue-router',
      variableName: 'VueRouter',
      path: '/dist/vue-router.min.js',
    },
    {
      packageName: 'vue-meta',
      variableName: 'VueMeta',
      path: '/dist/vue-meta.min.js',
    },
    {
      packageName: 'vue-i18n',
      variableName: 'VueI18n',
      path: '/dist/vue-i18n.min.js',
    },
    {
      packageName: 'pinia',
      variableName: 'Pinia',
      path: '/dist/pinia.iife.prod.js',
    },
    {
      packageName: 'oidc-client-ts',
      variableName: 'Oidc',
      path: '/dist/browser/oidc-client-ts.min.js',
      onerror: 'onOidcFallback && onOidcFallback()',
    },
    {
      packageName: 'axios',
      variableName: 'axios',
      path: '/dist/axios.min.js',
    },
    {
      packageName: 'moment',
      variableName: 'moment',
      path: ['/min/moment.min.js', '/locale/zh-cn.js', '/locale/en-gb.js'],
    },
    {
      packageName: 'jsoneditor',
      variableName: 'JSONEditor',
      path: '/dist/jsoneditor.min.js',
    },
    {
      packageName: 'mavon-editor',
      variableName: 'MavonEditor',
      path: '/dist/mavon-editor.js',
    },
    {
      packageName: 'quill',
      variableName: 'Quill',
      path: '/dist/quill.min.js',
    },
    {
      packageName: '@ace-fetch/core',
      variableName: ['AceFetch', 'Core'],
      path: '/dist/index.umd.production.js',
    },
    {
      packageName: '@ace-fetch/axios',
      variableName: ['AceFetch', 'Axios'],
      path: '/dist/index.umd.production.js',
    },
    {
      packageName: '@ace-fetch/vue',
      variableName: ['AceFetch', 'Vue'],
      path: '/dist/index.umd.production.js',
    },
    // {
    //   packageName: '@vue-async/module-loader',
    //   variableName: ['VueAsync', 'ModuleLoader'],
    //   path: '/dist/module-loader.umd.production.js',
    // },
    // 依赖 window.Vue, 临时通过打包解决
    // {
    //   packageName: '@vue-async/resource-manager',
    //   variableName: ['VueAsync', 'ResourceManager'],
    //   path: '/dist/resource-manager.umd.production.js',
    // },
    {
      packageName: '@iconfu/svg-inject',
      variableName: 'SVGInject',
      path: '/dist/svg-inject.min.js',
    },
  ],
};

function getPackageVersion(pkgName) {
  let pkgPath = resolve.sync(pkgName + '/package.json');
  let version;
  // Try to get the version if package.json exists.
  if (fs.existsSync(pkgPath)) {
    try {
      version = require(pkgPath).version;
    } catch {
      /**/
    }
  }
  return version;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function getPath(path, packageName = '', version = '') {
  return version
    ? `${packageName}@${version}${path.startsWith('/') ? '' : '/'}${path}`
    : path.startsWith('/')
    ? path.substring(1)
    : path;
}

function getCdnConfig(config = cdnConfig) {
  const { publicPath = '/', links = [], scripts = [] } = config;

  return {
    publicPath,
    externals: scripts.reduce((prev, { packageName, variableName }) => {
      variableName && (prev[packageName] = variableName);
      return prev;
    }, {}),
    links: links.reduce(
      (
        prev,
        { packageName, aliasName, path, publicPath, hash, append = false, version: addVersion = true, ...rest },
      ) => {
        assert(packageName, `Links config "packageName" is required!`);

        // 获取版本
        let version;
        if (addVersion) {
          version = getPackageVersion(packageName);
          assert(version, `package "${packageName}" can not get version!`);
        }

        const config = {
          attributes: rest,
          publicPath,
          hash,
          append,
        };

        // 格式化 path
        prev.push(
          ...(Array.isArray(path) ? path : [path]).map((p) => ({
            ...config,
            path: getPath(p, aliasName || packageName, version),
          })),
        );

        return prev;
      },
      [],
    ),
    scripts: scripts.reduce(
      (
        prev,
        {
          packageName,
          aliasName,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          variableName,
          path,
          publicPath,
          hash,
          append = false,
          version: addVersion = true,
          ...rest
        },
      ) => {
        assert(packageName, `Scripts config "packageName" is required!`);
        assert(path, `Scripts config "path" is required!`);

        // 获取版本
        let version;
        if (addVersion) {
          version = getPackageVersion(packageName);
          assert(version, `Package "${packageName}" can not get version!`);
        }

        const config = {
          attributes: rest,
          publicPath,
          hash,
          append,
        };

        // 格式化 path
        prev.push(
          ...(Array.isArray(path) ? path : [path]).map((p) => ({
            ...config,
            path: getPath(p, aliasName || packageName, version),
          })),
        );

        // 设置 external
        // html-webpack-tags-plugin variableName 限制只能是字符串
        // if (variableName) {
        //   config.external = { packageName, variableName };
        // }

        return prev;
      },
      [],
    ),
  };
}
module.exports = getCdnConfig;
