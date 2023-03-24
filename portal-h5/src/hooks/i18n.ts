import { IVueI18n } from 'vue-i18n';
import { getCurrentInstance } from '@vue/composition-api';
import { warn } from '@pomelo/shared-web';

export const useI18n = (): IVueI18n => {
  const instance = getCurrentInstance();
  if (!instance) {
    warn(process.env.NODE_ENV === 'production', 'method can only be used inside setup() or functional components');
    return undefined as any;
  }

  return instance.proxy.$i18n;
};
