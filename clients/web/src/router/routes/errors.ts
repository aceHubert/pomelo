// Types
import type { RouteConfig } from 'vue-router';

export const errorRoutes: Array<RouteConfig> = [
  {
    name: 'forbidden',
    path: '/forbidden',
    component: () => import(/* webpackChunkName: "common" */ '@/views/error/forbidden'),
    meta: {
      anonymous: true,
    },
  },
];
