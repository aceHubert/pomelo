import { ref, Ref } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';
import { useBasicApi } from '@/fetch/graphql';

// Types
import type { Plugin } from '@/types';

const optionPlugin: Plugin = async (app, inject) => {
  const basicApi = useBasicApi();

  const options = ref<Record<string, string>>({});

  try {
    const { options: values } = await basicApi.getAutoloadOptions();
    options.value = values;
  } catch (err) {
    warn(false, `Options loaded error, ${(err as Error).message}`);
  }

  inject('config', options);
};

export default optionPlugin;

declare module 'vue/types/vue' {
  interface Vue {
    $config: Ref<Record<string, string>>;
  }
}
