// Types
import type { RouteConfig } from 'vue-router';

export const routes: Array<RouteConfig> = [
  {
    path: '/f/:id(\\d+)',
    alias: ['/forms/:id(\\d+)'],
    name: 'form',
    component: () => import(/* webpackChunkName: "web-common" */ '../views/form'),
    props: (route) => ({
      id: route.params.id,
    }),
  },
  {
    path: '/p/:id(\\d+)',
    alias: ['/posts/:id(\\d+)'],
    name: 'post',
    component: () => import(/* webpackChunkName: "web-common" */ '../views/post'),
    props: (route) => ({
      id: route.params.id,
    }),
  },
  {
    path: '/:id(\\d+)',
    alias: ['/pages/:id(\\d+)'],
    name: 'page',
    component: () => import(/* webpackChunkName: "web-common" */ '../views/page'),
    props: (route) => ({
      id: route.params.id,
    }),
  },
  {
    path: '*',
    // dymanic page or handle error page inside component
    component: () => import(/* webpackChunkName: "web-common" */ '../views/page'),
  },
];
