import Vue from 'vue';
import VueMeta from 'vue-meta';
import { createRouter } from 'vue2-helpers/vue-router';
import { Modal } from '@/components';
import { i18n } from '@/i18n';
import { routes } from './routes';

// Types
import type { MetaInfo, MetaInfoComputed } from 'vue-meta/types/vue-meta';

Vue.use(VueMeta, {
  keyName: 'head',
  tagIDKeyName: 'hid',
  refreshOnceOnNavigation: true,
});

export const router = createRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, from, next) => {
  Modal.destroyAll(); // clear all modals
  const userManager = router.app.$userManager;

  // 从管理端预览打开预览页面时，先尝试登录
  if (window.name === 'preview' && !(await userManager.getUser())) {
    await userManager
      .signinSilent()
      .then((user) => {
        // 根据 user claims 设置 i18n locale
        if (user && user.profile.locale && i18n.locale !== user.profile.locale) {
          i18n.locale = user.profile.locale;
        }
      })
      .catch(() => '')
      .finally(() => {
        next();
      });
  } else {
    // console.log('beforeEach', to, from);
    next();
  }
});

declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ComponentOptions<V extends Vue> {
    head?: MetaInfo | MetaInfoComputed;
  }
}
