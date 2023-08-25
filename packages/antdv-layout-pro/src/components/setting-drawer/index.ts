import SettingDrawer from './SettingDrawer';

// Types
import type { Plugin } from 'vue-demi';

export default SettingDrawer;
export { SettingDrawer };

(SettingDrawer as typeof SettingDrawer & Exclude<Plugin, Function>).install = function (app) {
  app.component(SettingDrawer.name, SettingDrawer);
  return app;
};
