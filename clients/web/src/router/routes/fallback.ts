// Types
import type { RouteConfig } from 'vue-router';

export const fallbackRoute: RouteConfig = {
  name: 'fallback',
  path: '*',
  component: () => import(/* webpackChunkName: "common" */ '@/views/error/fallback'),
  meta: {
    anonymous: true,
  },
};
