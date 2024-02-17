import Vue from 'vue';
import VueMeta from 'vue-meta';
import { createRouter } from 'vue2-helpers/vue-router';
import { Modal } from '@/components';
import { errorRef } from '@/shared';
import { useSiteInitApi } from '@/fetch/apis';
import { routes } from './routes';

// Types
import type { MetaInfo, MetaInfoComputed } from 'vue-meta/types/vue-meta';

Vue.use(VueMeta, {
  keyName: 'head',
  tagIDKeyName: 'vmid',
  refreshOnceOnNavigation: true,
});

export const router = createRouter({
  base: '/',
  mode: 'history',
  routes,
});

// preset anonymous routes
const AnonymousRouteNames = ['site-init', 'signin', 'session-timeout'];
const SiteInitRequiredSessionKey = '__SITE_INIT_REQUEST__';

router.beforeEach(async (to, from, next) => {
  let siteInitRequired = sessionStorage.getItem(SiteInitRequiredSessionKey) !== 'false';

  if (siteInitRequired) {
    const siteInitApi = useSiteInitApi();

    siteInitRequired = await siteInitApi.check().then(({ result }) => result);
    if (siteInitRequired && to.name !== 'site-init') {
      return next({ name: 'site-init', query: { redirect: to.fullPath } });
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
    userManager.getUser().then(function (user) {
      if (user === null || user.expired) {
        userManager.signin({ noInteractive: true });
      } else {
        next();

        // if (user.profile.ut !== '1') {
        //   next({ name: '403.8', replace: true });
        // } else {
        //   next();
        //   // console.debug('route to ' + to.path)
        // }
      }
    });
  }
});

declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ComponentOptions<V extends Vue> {
    head?: MetaInfo | MetaInfoComputed;
  }
}
