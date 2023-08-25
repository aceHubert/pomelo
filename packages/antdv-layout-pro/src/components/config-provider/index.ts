import ConfigProvider from './ConfigProvider';

// Types
import type { Plugin } from 'vue-demi';

export default ConfigProvider;
export { ConfigProvider };
export { ConfigConsumerProps } from './configConsumerProps';
export type { ConfigProviderProps } from './ConfigProvider';

(ConfigProvider as typeof ConfigProvider & Exclude<Plugin, Function>).install = function (app) {
  app.component(ConfigProvider.name, ConfigProvider);
};
