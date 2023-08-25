import LocaleDropdown from './LocaleDropdown';

// Types
import type { Plugin } from 'vue-demi';

export default LocaleDropdown;
export { LocaleDropdown };

(LocaleDropdown as typeof LocaleDropdown & Exclude<Plugin, Function>).install = function (app) {
  app.component(LocaleDropdown.name, LocaleDropdown);
  return app;
};
