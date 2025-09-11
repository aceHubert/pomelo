// Types
import type { RouteConfig } from 'vue-router';

export const basicRoutes: Array<RouteConfig> = [
  {
    name: 'index',
    path: '/',
    component: () => import(/* webpackChunkName: "initialize-common-views" */ '../../views/index/index'),
    meta: {
      breadcrumb: false,
      anonymous: true,
    },
  },
];
