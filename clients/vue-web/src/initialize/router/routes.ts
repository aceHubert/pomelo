// Types
import type { RouteConfig } from 'vue-router';

export const routes: Array<RouteConfig> = [
  {
    name: 'siteInit',
    path: '/',
    component: () => import(/* webpackChunkName: "initialize-common" */ '../views/index/index'),
    meta: {
      breadcrumb: false,
      anonymous: true,
    },
  },
  {
    name: 'not-found',
    path: '*',
    component: () => import(/* webpackChunkName: "initialize-common" */ '@/views/error/page-not-fount'),
    meta: {
      anonymous: true,
    },
  },
];
