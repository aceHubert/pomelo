import MessageDropdown from './MessageDropdown';

// Types
import type { Plugin } from 'vue-demi';

export default MessageDropdown;
export { MessageDropdown };

(MessageDropdown as typeof MessageDropdown & Exclude<Plugin, Function>).install = function (app) {
  app.component(MessageDropdown.name, MessageDropdown);
  return app;
};
