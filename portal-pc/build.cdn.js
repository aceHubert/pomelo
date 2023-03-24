/**
 * 通过 cdn 加载资源
 * 文档：https://github.com/jharris4/html-webpack-tags-plugin
 */

const fs = require('fs');

const cdnConfig = {
  cdnRegistry: 'https://www.unpkg.com',
  links: [
    // {path: 'xxx.css', prefetch: true}
  ],
  scripts: [
    {
      packageName: 'vue-router',
      variableName: 'VueRouter',
      path: '/dist/vue-router.min.js',
      defer: false,
    },
    {
      packageName: 'vue-meta',
      variableName: 'VueMeta',
      path: '/dist/vue-meta.min.js',
      defer: false,
    },
    // ↑↑↑ 以上添加在 Vue 前禁止 package 遇到 window.Vue 时会主动使用 Vue.use install执行 ↑↑↑
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
      packageName: '@vue-async/fetch',
      variableName: ['VueAsync', 'Fetch'],
      path: '/dist/fetch.umd.production.js',
    },
    {
      packageName: '@vue-async/fetch-axios',
      variableName: ['VueAsync', 'FetchAxios'],
      path: '/dist/fetch-axios.umd.production.js',
    },
    // 打开必须调用，不然会阻止 vue-router hook
    // {
    //   packageName: '@vue-async/module-loader',
    //   variableName: ['VueAsync', 'ModuleLoader'],
    //   path: '/dist/module-loader.umd.production.js',
    // },
    {
      packageName: '@vue-async/resource-manager',
      variableName: ['VueAsync', 'ResourceManager'],
      path: '/dist/resource-manager.umd.production.js',
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
    links: links.map(({ packageName, path, ...rest }) => {
      assert(packageName, `Links config "packageName" is required!`);

      // 获取版本
      const version = getPackageVersion(packageName);
      assert(version, `package "${packageName}" can not get version!`);

      const config = {
        attributes: rest,
      };

      // 格式化 path
      config.path = `${packageName}@${version}${path.startsWith('/') ? '' : '/'}${path}`;

      return config;
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    scripts: scripts.map(({ packageName, variableName, path, ...rest }) => {
      assert(packageName, `Scripts config "packageName" is required!`);

      // 获取版本
      const version = getPackageVersion(packageName);
      assert(version, `Package "${packageName}" can not get version!`);

      const config = {
        attributes: rest,
      };

      // 格式化 path
      config.path = `${packageName}@${version}${path.startsWith('/') ? '' : '/'}${path}`;

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
