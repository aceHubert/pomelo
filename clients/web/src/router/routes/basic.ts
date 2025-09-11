// Types
import type { RouteConfig } from 'vue-router';

export const basicRoutes: Array<RouteConfig> = [
  {
    path: '/f/:id(\\d+)',
    alias: ['/forms/:id(\\d+)'],
    name: 'form',
    component: () => import(/* webpackChunkName: "web-common-views" */ '@/views/form/index'),
    props: (route) => ({
      id: Number(route.params.id),
    }),
  },
  {
    path: '/p/:id(\\d+)',
    alias: ['/posts/:id(\\d+)'],
    name: 'post',
    component: () => import(/* webpackChunkName: "web-common-views" */ '@/views/post/index'),
    props: (route) => ({
      id: Number(route.params.id),
    }),
  },
  {
    path: '/:id(\\d+)',
    alias: ['/pages/:id(\\d+)'],
    name: 'page',
    component: () => import(/* webpackChunkName: "web-common-views" */ '@/views/page/index'),
    props: (route) => ({
      id: Number(route.params.id),
    }),
  },
];
