import { inject } from '@vue/composition-api';
import { ConfigConsumerProps } from '../config-provider/configConsumerProps';

// Types
import { ConfigProviderProps } from '../config-provider/ConfigProvider';

export const useConfigProvider = () => {
  return inject<ConfigProviderProps>('configProvider', () => ConfigConsumerProps);
};
