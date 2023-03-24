import 'whatwg-fetch'; // fetch polyfill
import 'custom-event-polyfill';

import Vue, { ComponentOptions } from 'vue';
import VueCompositionApi from '@vue/composition-api';
import { afetch } from '@/fetch/restapi';
import { i18n } from './i18n';
import { pinia } from './store';
import { router } from './router';
import App from './App';
import './auth';
import './assets/styles/index.less';

Vue.use(VueCompositionApi);
Vue.config.productionTip = false;

// Plugins
import optionsPlugin from './plugins/options';
import pubSubMessagePlugin from './plugins/pubsub-messages';
import microAppPlugin from './plugins/micro-app';

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

  if (typeof optionsPlugin === 'function') {
    await optionsPlugin(app, inject);
  }

  if (typeof pubSubMessagePlugin === 'function') {
    await pubSubMessagePlugin(app, inject);
  }

  if (typeof microAppPlugin === 'function') {
    await microAppPlugin(app, inject);
  }

  return {
    app,
  };
}

createApp().then(({ app }) => {
  new Vue(app).$mount('#app');
});
