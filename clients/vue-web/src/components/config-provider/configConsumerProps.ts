import { ConfigConsumerProps as AntConfigConsumerProps } from 'ant-design-vue/lib/config-provider/configConsumerProps';
import { DeviceType } from '@/types';

export const ConfigConsumerProps = Object.assign({}, AntConfigConsumerProps, {
  theme: 'light',
  device: DeviceType.Desktop,
  i18nRender(key: string, fallback: string) {
    return fallback;
  },
});
