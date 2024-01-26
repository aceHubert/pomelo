import { ref } from '@vue/composition-api';
import { warn } from '@ace-util/core';
import { useBasicApi } from '@/fetch/apis';

// Types
import type { Ref } from '@vue/composition-api';
import type { Plugin } from '@/types';

const optionPlugin: Plugin = async (app, inject) => {
  const basicApi = useBasicApi();

  const options = ref<Record<string, string>>({});

  try {
    const autoload = await basicApi.getAutoloadOptions();
    options.value = autoload.options;
  } catch (err: any) {
    warn(false, `Options loaded error, ${err.message}`);
  }

  inject('config', options);
};

export default optionPlugin;

declare module 'vue/types/vue' {
  interface Vue {
    $config: Ref<Record<string, string>>;
  }
}
