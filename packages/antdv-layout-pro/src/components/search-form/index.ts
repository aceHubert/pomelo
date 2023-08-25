import SearchForm from './SearchForm';

// Types
import type { Plugin } from 'vue-demi';

export default SearchForm;
export { SearchForm };
export type { SearchFromProps, StatusOption, BulkAcitonOption } from './SearchForm';

(SearchForm as typeof SearchForm & Exclude<Plugin, Function>).install = function (app) {
  app.component(SearchForm.name, SearchForm);
  return app;
};
