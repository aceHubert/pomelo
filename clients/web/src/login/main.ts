/* eslint-disable import/order */
import 'whatwg-fetch'; // fetch polyfill
import 'custom-event-polyfill';

import Vue, { type ComponentOptions } from 'vue';
import VueCompositionApi from '@vue/composition-api';
import { Authoriztion } from '@/auth';
import { apiFetch } from '@/fetch';
import { graphqlFetch } from '@/fetch/graphql';
import { i18n } from '@/i18n';
import { pinia } from '@/store';
import * as plugins from '@/plugins';

// Local
import { router } from './router/index';
import App from './App';
import './assets/styles/index.less';

// Locales
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

Vue.config.productionTip = false;
Vue.use(VueCompositionApi);
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

  const context = {
    app,
    router,
    pinia,
  };
  for (const plugin of Object.values(plugins)) {
    if (typeof plugin === 'function') {
      await plugin(context, inject);
    }
  }

  return context;
}

createApp().then(({ app }) => {
  const _app = new Vue(app);

  _app.$mount('#app');
});
