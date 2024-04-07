/* eslint-disable import/order */
import 'whatwg-fetch'; // fetch polyfill
import 'custom-event-polyfill';

import Vue, { type ComponentOptions } from 'vue';
import { type Route, type NavigationGuardNext as Next } from 'vue-router';
import VueCompositionApi from '@vue/composition-api';
import ResourceManagerVuePlugin from '@vue-async/resource-manager';
import { Modal } from './components';
import { afetch } from './fetch';
import { i18n } from './i18n';
import { pinia } from './store';
import { router } from './router';
import { siteInitRequiredRef } from './shared';
import App from './App';
import './auth';
import './registerServiceWorker';
import './assets/styles/index.less';

// Plugins
import plugins from './plugins';

Vue.use(VueCompositionApi);
Vue.use(ResourceManagerVuePlugin, { mode: 'visible' });
Vue.config.productionTip = false;

async function createApp() {
  const app: ComponentOptions<Vue> = {
    afetch,
    i18n,
    pinia,
    router,
    render: (h) => h(App),
  };

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

  for (const plugin of plugins) {
    if (typeof plugin === 'function') {
      await plugin(context, inject);
    }
  }

  return context;
}

// preset anonymous routes
const AnonymousRouteNames = ['site-init', 'signin', 'session-timeout'];
function auth(this: Vue, to: Route, from: Route, next: Next) {
  const userManager = this.$userManager;

  if (siteInitRequiredRef.value && to.name !== 'site-init') {
    next({ name: 'site-init', query: { redirect: to.fullPath } });
  } else if (to.name === 'signout') {
    userManager.signout();
  } else if ((to.name && AnonymousRouteNames.includes(to.name)) || to.meta?.anonymous === true) {
    next();
  } else {
    userManager.getUser().then(function (user) {
      if (user === null || user.expired) {
        userManager.signin({
          noInteractive: true,
          redirect_uri: `${window.location.origin}${to.fullPath}`,
        });
      } else {
        next();
        // if (user.profile.ut !== '1') {
        //   next({ name: '403.8', replace: true });
        // } else {
        //   next();
        //   // console.debug('route to ' + to.path)
        // }
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

  router.beforeEach(auth.bind(_app));

  router.afterEach(clearModals.bind(_app));

  router.isReady().then(() => {
    auth.call(_app, router.currentRoute, router.currentRoute, (path) => {
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
      router.push(path, undefined, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      });
    });
  });
});
