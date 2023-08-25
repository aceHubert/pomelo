import AsyncTable from './AsyncTable';

// Types
import type { Plugin } from 'vue-demi';

export default AsyncTable;
export { AsyncTable };
export type { AsyncTableProps, DataSourceFn, PagedDataSource, Column, AlertProps } from './AsyncTable';

(AsyncTable as typeof AsyncTable & Exclude<Plugin, Function>).install = function (app) {
  app.component(AsyncTable.name, AsyncTable);
  return app;
};
