import AvatarDropdown from './AvatarDropdown';

// Types
import type { Plugin } from 'vue-demi';

export default AvatarDropdown;
export { AvatarDropdown };
export { AvatarDropdownAction } from './AvatarDropdown';

(AvatarDropdown as typeof AvatarDropdown & Exclude<Plugin, Function>).install = function (app) {
  app.component(AvatarDropdown.name, AvatarDropdown);
  return app;
};
