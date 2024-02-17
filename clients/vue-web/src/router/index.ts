import Vue from 'vue';
import VueMeta from 'vue-meta';
import { createRouter } from 'vue2-helpers/vue-router';
import { absoluteGo, trailingSlash, getEnv } from '@ace-util/core';
import { Modal } from '@/components';
import { useSiteInitApi } from '@/fetch/apis';
import { errorRef } from '@/shared';
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

// preset anonymous routes
const AnonymousRouteNames = ['signin', 'session-timeout'];
const SiteInitRequiredSessionKey = '__SITE_INIT_REQUEST__';

router.beforeEach(async (to, from, next) => {
  let siteInitRequired = sessionStorage.getItem(SiteInitRequiredSessionKey) !== 'false';

  if (siteInitRequired) {
    const siteInitApi = useSiteInitApi();

    // 从接口获取siteInitRequired
    siteInitRequired = await siteInitApi.check().then(({ result }) => result);
    if (siteInitRequired) {
      return absoluteGo(
        `${trailingSlash(getEnv('adminOrigin', window.location.origin, window._ENV))}site-init?redirect=${
          window.location.href
        }`,
      );
    }

    // 通过sessionStorage缓存siteInitRequired，避免每次都请求接口
    !siteInitRequired && sessionStorage.setItem(SiteInitRequiredSessionKey, 'false');
  }

  // clear all modals
  Modal.destroyAll();

  // clear error
  if (to.path !== from.path) {
    errorRef.value = false;
  }

  const userManager = router.app.$userManager;

  if (to.name === 'signout') {
    userManager.signout();
  } else if ((to.name && AnonymousRouteNames.includes(to.name)) || to.meta?.anonymous === true) {
    next();
  } else {
    // 从管理端预览打开预览页面时，先尝试登录
    if (window.name === 'preview' && !(await userManager.getUser())) {
      await userManager
        .signinSilent()
        .catch(() => {})
        .finally(() => {
          next();
        });
    } else {
      // console.log('beforeEach', to, from);
      next();
    }
  }
});

declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ComponentOptions<V extends Vue> {
    head?: MetaInfo | MetaInfoComputed;
  }
}
