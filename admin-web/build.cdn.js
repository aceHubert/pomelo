/**
 * 通过 cdn 加载资源
 * 文档：https://github.com/jharris4/html-webpack-tags-plugin
 */

const fs = require('fs');

const cdnConfig = {
  cdnRegistry: 'https://www.unpkg.com',
  links: [
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/styles/vs.min.css',
    },
  ],
  scripts: [
    // vue-meta 遇到 window.Vue 时会主动 install, 放在 vue 前面执行，通过内置代码 Vue.use 执行
    {
      packageName: 'vue-meta',
      variableName: 'VueMeta',
      path: '/dist/vue-meta.min.js',
    },
    {
      // 通过 packageName 从 node_modules 获取版本并拼接上registey path
      packageName: 'vue',
      // 通过 variableName 设置 the webpack config's externals  { packageName: variableName }
      variableName: 'Vue',
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
    {
      packageName: 'vue-router',
      variableName: 'VueRouter',
      path: '/dist/vue-router.min.js',
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
      packageName: 'oidc-client',
      variableName: 'Oidc',
      path: '/dist/oidc-client.min.js',
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
      path: '/min/moment.min.js',
    },
    { packageName: 'moment', path: '/locale/zh-cn.js' },
    { packageName: 'moment', path: '/locale/en-gb.js' },
    {
      packageName: '@ckeditor/ckeditor5-vue2',
      variableName: 'CKEditor',
      path: '/dist/ckeditor.js',
    },
    // {
    //   packageName: '@ckeditor/ckeditor5-build-decoupled-document',
    //   variableName: 'DecoupledEditor',
    //   path: '/build/ckeditor.min.js',
    // },
    // {
    //   packageName: '@ckeditor/ckeditor5-build-decoupled-document',
    //   path: '/build/translations/zh-cn.js',
    // },
    // {
    //   packageName: '@ckeditor/ckeditor5-build-decoupled-document',
    //   path: '/build/translations/en-gb.js',
    // },
    {
      packageName: '@vue-async/fetch',
      variableName: ['VueAsync', 'Fetch'],
      path: '/dist/fetch.umd.production.js',
    },
    {
      packageName: '@vue-async/fetch-axios',
      variableName: ['VueAsync', 'FetchAxios'],
      path: '/dist/fetch-axios.umd.production.js',
    },
    {
      packageName: '@vue-async/module-loader',
      variableName: ['VueAsync', 'ModuleLoader'],
      path: '/dist/module-loader.umd.production.js',
    },
    {
      packageName: '@vue-async/resource-manager',
      variableName: ['VueAsync', 'ResourceManager'],
      path: '/dist/resource-manager.umd.production.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      variableName: 'hljs',
      path: '/highlight.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/bash.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/javascript.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/typescript.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/css.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/less.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/scss.min.js',
    },
    {
      packageName: 'highlight.js',
      aliasName: '@highlightjs/cdn-assets',
      path: '/languages/json.min.js',
    },
    {
      packageName: 'markdown-it',
      variableName: 'markdownit',
      path: 'dist/markdown-it.min.js',
    },
  ],
};

function getPackageVersion(pkgName) {
  let pkgPath = require.resolve(pkgName + '/package.json');
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

function getCdnConfig(config = cdnConfig) {
  const { cdnRegistry = '/', links = [], scripts = [] } = config;

  return {
    cdnRegistry,
    externals: scripts.reduce((prev, { packageName, variableName }) => {
      variableName && (prev[packageName] = variableName);
      return prev;
    }, {}),
    links: links.map(({ packageName, aliasName, path, ...rest }) => {
      assert(packageName, `Links config "packageName" is required!`);

      // 获取版本
      const version = getPackageVersion(packageName);
      assert(version, `package "${packageName}" can not get version!`);

      const config = {
        attributes: rest,
      };

      // 格式化 path
      config.path = `${aliasName || packageName}@${version}${path.startsWith('/') ? '' : '/'}${path}`;

      return config;
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    scripts: scripts.map(({ packageName, aliasName, variableName, path, ...rest }) => {
      assert(packageName, `Scripts config "packageName" is required!`);

      // 获取版本
      const version = getPackageVersion(packageName);
      assert(version, `Package "${packageName}" can not get version!`);

      const config = {
        attributes: rest,
      };

      // 格式化 path
      config.path = `${aliasName || packageName}@${version}${path.startsWith('/') ? '' : '/'}${path}`;

      // 设置 external
      // html-webpack-tags-plugin variableName 限制只能是字符串
      // if (variableName) {
      //   config.external = { packageName, variableName };
      // }

      return config;
    }),
    append: {
      links: [],
      scripts: [],
    },
  };
}

module.exports = getCdnConfig;
