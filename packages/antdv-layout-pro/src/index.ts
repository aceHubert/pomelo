import * as components from './components';
import { version } from './version';

// Types
import type { App } from 'vue-demi';

export const install = function (app: App) {
  Object.keys(components).forEach((key) => {
    // eslint-disable-next-line import/namespace
    const component = components[key];
    if (component.install) {
      app.use(component);
    }
  });

  return app;
};

export * from './components';
export { version };
export default {
  version,
  install,
};
