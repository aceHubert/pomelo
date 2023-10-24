/* eslint-disable import/order */
import Vue, { type ComponentOptions } from 'vue';
import VueCompositionApi from '@vue/composition-api';
import ResourceManagerVuePlugin from '@vue-async/resource-manager';
import { afetch } from './fetch';
import { i18n } from './i18n';
import { router } from './router';
import { pinia } from './store';
import App from './App';
import '@pomelo/theme/lib/index.less';
import './assets/styles/index.less';

// Plugins
import optionsPlugin from './plugins/options';
import './plugins/hljs';

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

  if (typeof optionsPlugin === 'function') {
    await optionsPlugin(app, inject);
  }

  return {
    app,
  };
}

createApp().then(({ app }) => {
  new Vue(app).$mount('#app');
});
