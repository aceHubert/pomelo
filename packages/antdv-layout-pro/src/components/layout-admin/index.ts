import { composeExport } from '../../utils';
import { BreadcrumbProvider, NestedBreadcrumb } from './NestedBreadcrumb';
import LayoutAdminBase from './LayoutAdmin';

// Types
import type { Plugin } from 'vue-demi';

const LayoutAdmin = composeExport(LayoutAdminBase, {
  BreadcrumbProvider,
  NestedBreadcrumb,
});

export default LayoutAdmin;
export { LayoutAdmin };

(LayoutAdmin as typeof LayoutAdmin & Exclude<Plugin, Function>).install = function (app) {
  app.component(LayoutAdmin.name, LayoutAdmin);
  return app;
};
