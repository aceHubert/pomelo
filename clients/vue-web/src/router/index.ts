import Vue from 'vue';
import VueRouter from 'vue-router';
import VueMeta from 'vue-meta';
import { userManager } from '@/auth';

// Types
import type { RouteConfig } from 'vue-router';
import type { MetaInfo, MetaInfoComputed } from 'vue-meta/types/vue-meta';

Vue.use(VueRouter);
Vue.use(VueMeta, {
  keyName: 'head',
  tagIDKeyName: 'hid',
  refreshOnceOnNavigation: true,
});

const routes: Array<RouteConfig> = [
  {
    path: '/f/:id(\\d+)',
    alias: ['/forms/:id(\\d+)'],
    name: 'form',
    component: () => import(/* webpackChunkName: "form" */ '../views/form'),
    props: (route) => ({
      id: Number(route.params.id),
    }),
  },
  {
    path: '/p/:id(\\d+)',
    alias: ['/posts/:id(\\d+)'],
    name: 'post',
    component: () => import(/* webpackChunkName: "post" */ '../views/post'),
    props: (route) => ({
      id: Number(route.params.id),
    }),
  },
  {
    path: '/:id(\\d+)',
    alias: ['/pages/:id(\\d+)'],
    name: 'page',
    component: () => import(/* webpackChunkName: "page" */ '../views/page'),
    props: (route) => ({
      id: Number(route.params.id),
    }),
  },
  {
    path: '*',
    // dymanic page or handle error page inside component
    component: () => import(/* webpackChunkName: "page" */ '../views/page'),
  },
];

export const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, from, next) => {
  // 从管理端预览打开预览页面时，先尝试登录
  if (window.name === 'preview' && !(await userManager.getUser())) {
    await userManager
      .signinSilent()
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
