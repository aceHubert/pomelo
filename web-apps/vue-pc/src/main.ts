import VueCompositionApi, { createApp, h } from '@vue/composition-api';
import ResourceManagerVuePlugin from '@vue-async/resource-manager';
import { afetch } from './fetch';
import { i18n } from './i18n';
import { router } from './router';
import { pinia } from './store';
import App from './App';
import './auth';
import './assets/styles/index.less';

const app = createApp({
  router,
  pinia,
  afetch,
  i18n,
  render: () => h(App),
});

app.use(VueCompositionApi);
app.use(ResourceManagerVuePlugin, { mode: 'visible' });

app.config.productionTip = false;

app.mount('#app');
