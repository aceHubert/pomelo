// Types
import type { RouteConfig } from 'vue-router';

export const routes: Array<RouteConfig> = [
  {
    name: 'login',
    path: '/',
    component: () => import(/* webpackChunkName: "login-common" */ '../views/login/index'),
  },
  {
    name: 'password-modify',
    path: '/password/modify',
    component: () => import(/* webpackChunkName: "login-common" */ '../views/password/modify'),
  },
  {
    name: 'password-forgot',
    path: '/password/forgot',
    component: () => import(/* webpackChunkName: "login-common" */ '../views/password/forgot'),
  },
  {
    name: 'not-found',
    path: '*',
    component: () => import(/* webpackChunkName: "login-common" */ '@/views/error/page-not-fount'),
    meta: {
      anonymous: true,
    },
  },
];
