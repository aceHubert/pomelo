import { inject } from 'vue-demi';
import { ConfigConsumerProps } from '../components/config-provider/configConsumerProps';

// Types
import type { ConfigProviderProps } from '../components/config-provider/ConfigProvider';

export const useConfigProvider = () => {
  return inject<ConfigProviderProps>('configProvider', () => ConfigConsumerProps);
};
