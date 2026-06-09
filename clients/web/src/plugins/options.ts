import { warn } from '@ace-util/core';
import { useBasicApi } from '@/fetch/apis';

// Types
import type { Plugin } from '@/types';

let autoloadOptions: Record<string, string> | undefined;

const plugin: Plugin = async ({ app }, inject) => {
  const basicApi = useBasicApi(app.graphqlFetch);

  let options: Record<string, string> = autoloadOptions || {};

  if (!Object.keys(options).length) {
    try {
      const autoload = await basicApi.getAutoloadOptions();
      options = autoload.options;
      autoloadOptions = options;
    } catch (err: any) {
      warn(false, `Options loaded error, ${err.message}`);
    }
  }

  inject('config', options);
};

export default plugin;

declare module 'vue/types/vue' {
  interface Vue {
    $config: Readonly<Record<string, string>>;
  }
}
