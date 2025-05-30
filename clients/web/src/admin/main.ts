/* eslint-disable import/order */
import 'whatwg-fetch'; // fetch polyfill
import 'custom-event-polyfill';

import Vue, { type ComponentOptions } from 'vue';
import { type Route, type NavigationGuardNext as Next } from 'vue-router';
import VueCompositionApi from '@vue/composition-api';
import ResourceManagerVuePlugin from '@vue-async/resource-manager';
import { Authoriztion } from '@/auth';
import { Modal } from '@/components';
import { apiFetch } from '@/fetch';
import { graphqlFetch } from '@/fetch/graphql';
import { i18n } from '@/i18n';
import { pinia } from '@/store';
import { AuthTypeOptionName } from '@/constants';
import { AuthType } from '@/types';
import { errorRef, SharedError } from '@/shared';
import * as plugins from '@/plugins';

// Local
import { router } from './router';
import App from './App';
import './registerServiceWorker';
import './assets/styles/index.less';

// Locales
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

Vue.config.productionTip = false;
Vue.use(VueCompositionApi);
Vue.use(ResourceManagerVuePlugin, { mode: 'visible' });
Vue.use(Authoriztion);

async function createApp() {
  const app: ComponentOptions<Vue> = {
    apiFetch,
    graphqlFetch,
    i18n,
    pinia,
    router,
    render: (h) => h(App),
  };

  // set locales
  i18n.setLocaleMessage('zh-CN', zhCN);
  i18n.setLocaleMessage('en-US', enUS);

  function inject(key: string, value: any) {
    if (!key) {
      throw new Error('inject(key, value) has no key provided');
    }
    if (value === undefined) {
      throw new Error(`inject('${key}', value) has no value provided`);
    }

    key = '$' + key;
    // Add into app
    (app as any)[key] = value;

    // Check if plugin not already installed
    const installKey = '__' + key + '_installed__';
    if ((Vue as any)[installKey]) {
      return;
    }
    (Vue as any)[installKey] = true;

    // Call Vue.use() to install the plugin into vm
    Vue.use(() => {
      if (!Object.prototype.hasOwnProperty.call(Vue.prototype, key)) {
        Object.defineProperty(Vue.prototype, key, {
          get() {
            return this.$root.$options[key];
          },
        });
      }
    });
  }

  const context = { app, router, pinia };

  for (const plugin of Object.values(plugins)) {
    if (typeof plugin === 'function') {
      await plugin(context, inject);
    }
  }

  return context;
}

// preset anonymous routes
function authMiddleware(this: Vue, to: Route, from: Route, next: Next) {
  const userManager = this.$userManager;

  if (to.name === 'signout') {
    userManager
      .signout({
        popup: true,
        // redirect_uri: (router.options.base ?? '/').replace(/\/$/, ''),
      })
      .then(userManager.getUser)
      .then((user) => {
        // 未退出当前用户
        !user && next('/');
      });
  } else if (to.meta?.anonymous === true) {
    next();
  } else {
    userManager.getUser().then(function (user) {
      if (user === null || user.expired) {
        userManager
          .signin({
            noInteractive: true,
            popup: true,
            redirect_uri: `${router.options.base ?? '/'}${to.fullPath.slice(1)}`,
          })
          .then(next)
          .catch(() => {
            errorRef.value = new SharedError(i18n.tv('unauthorized.message', '授权失败, 请重试') as string, 404);
            next();
          });
      } else {
        // next();
        if (user.profile.role === 'subscriber') {
          next({ name: 'forbidden', replace: true });
        } else {
          next();
        }
      }
    });
  }
}

function clearModals(this: Vue) {
  // clear all modals
  Modal.destroyAll();
}

createApp().then(({ app, router }) => {
  const _app = new Vue(app);

  // Set auth type
  const authType = _app.$config[AuthTypeOptionName] as AuthType;
  authType && Object.values(AuthType).includes(authType) && Authoriztion.setType(authType);

  router.beforeEach(authMiddleware.bind(_app));
  router.afterEach(clearModals.bind(_app));
  router.isReady().then(() => {
    authMiddleware.call(_app, router.currentRoute, router.currentRoute, (path) => {
      // If not redirected
      if (!path || typeof path === 'function') {
        typeof path === 'function' && path.call(null, _app);
        _app.$mount('#app');
        return;
      }

      // Add a one-time afterEach hook to
      // mount the app wait for redirect and route gets resolved
      const unregisterHook = router.afterEach(() => {
        unregisterHook();
        _app.$mount('#app');
      });

      // Push the path and let route to be resolved
      router[path.replace ? 'replace' : 'push'](path, undefined, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      });
    });
  });
});
