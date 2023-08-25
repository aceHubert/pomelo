import Breadcrumb from './Breadcrumb';

// Types
import type { Plugin } from 'vue-demi';

export default Breadcrumb;
export { Breadcrumb };
export type { BreadcrumbItem } from './Breadcrumb';

(Breadcrumb as typeof Breadcrumb & Exclude<Plugin, Function>).install = function (app) {
  app.component(Breadcrumb.name, Breadcrumb);
  return app;
};
