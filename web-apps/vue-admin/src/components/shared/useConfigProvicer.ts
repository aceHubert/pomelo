import { inject } from '@vue/composition-api';
import { ConfigConsumerProps } from '../config-provider/configConsumerProps';

// Types
import type { ConfigProviderProps } from '../config-provider/ConfigProvider';

export const useConfigProvider = () => {
  return inject<ConfigProviderProps>('configProvider', () => ConfigConsumerProps);
};
