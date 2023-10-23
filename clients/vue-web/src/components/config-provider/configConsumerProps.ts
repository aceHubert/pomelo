import { ConfigConsumerProps as AntConfigConsumerProps } from 'ant-design-vue/lib/config-provider/configConsumerProps';

export const ConfigConsumerProps = Object.assign({}, AntConfigConsumerProps, {
  theme: 'light',
  device: 'desktop',
  i18nRender(key: string, fallback: string) {
    return fallback;
  },
});
