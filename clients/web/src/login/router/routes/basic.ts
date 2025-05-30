// Types
import type { RouteConfig } from 'vue-router';

export const basicRoutes: Array<RouteConfig> = [
  {
    name: 'login',
    path: '/',
    component: () => import(/* webpackChunkName: "login-common" */ '../../views/login/index'),
  },
  {
    name: 'password-modify',
    path: '/password/modify',
    component: () => import(/* webpackChunkName: "login-common" */ '../../views/password/modify'),
  },
  {
    name: 'password-forgot',
    path: '/password/forgot',
    component: () => import(/* webpackChunkName: "login-common" */ '../../views/password/forgot'),
  },
];
