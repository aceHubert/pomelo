/* eslint-disable import/order */
import 'whatwg-fetch'; // fetch polyfill
import 'custom-event-polyfill';

import Vue, { type ComponentOptions } from 'vue';
import VueCompositionApi from '@vue/composition-api';
import { apiFetch } from '@/fetch';
import { i18n } from '@/i18n';
import { pinia } from '@/store';

// Local
import { router } from './router';
import App from './App';
import './assets/styles/index.less';

// Locales
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

Vue.use(VueCompositionApi);
Vue.config.productionTip = false;

async function createApp() {
  const app: ComponentOptions<Vue> = {
    afetch: apiFetch,
    i18n,
    pinia,
    router,
    render: (h) => h(App),
  };

  // set locales
  i18n.setLocaleMessage('zh-CN', zhCN);
  i18n.setLocaleMessage('en-US', enUS);

  const context = { app, router, pinia };

  return context;
}

createApp().then(({ app }) => {
  const _app = new Vue(app);

  _app.$mount('#app');
});
