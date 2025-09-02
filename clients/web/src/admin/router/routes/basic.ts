import { RouterChild } from '@/layouts/components';

// Types
import type { RouteConfig } from 'vue-router';

export const basicRoutes: Array<RouteConfig> = [
  {
    name: 'dashboard',
    path: '/',
    alias: ['/dashboard'],
    component: () => import(/* webpackChunkName: "admin-common" */ '../../views/dashboard/index'),
    meta: {
      breadcrumb: false,
    },
  },
  {
    name: 'media',
    path: '/medias',
    component: () => import(/* webpackChunkName: "admin-medias" */ '../../views/media/index'),
  },
  {
    name: 'category',
    path: '/categories',
    component: () => import(/* webpackChunkName: "admin-posts" */ '../../views/category/index'),
    props: (route) => ({ id: Number(route.params.id) }),
  },
  {
    name: 'tag',
    path: '/tags',
    component: () => import(/* webpackChunkName: "admin-posts" */ '../../views/tag/index'),
    props: (route) => ({ id: Number(route.params.id) }),
  },
  {
    path: '/forms',
    component: RouterChild,
    children: [
      {
        name: 'forms',
        path: '',
        component: () => import(/* webpackChunkName: "admin-forms" */ '../../views/form/index'),
      },
      {
        name: 'form-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-forms" */ '../../views/form/design/index'),
      },
      {
        name: 'form-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-forms" */ '../../views/form/design/index'),
        props: (route) => ({ id: Number(route.params.id) }),
      },
    ],
  },
  {
    path: '/pages',
    component: RouterChild,
    children: [
      {
        name: 'pages',
        path: '',
        component: () => import(/* webpackChunkName: "admin-pages" */ '../../views/page/index'),
      },
      {
        name: 'page-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-pages" */ '../../views/page/design/index'),
      },
      {
        name: 'page-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-pages" */ '../../views/page/design/index'),
        props: (route) => ({ id: Number(route.params.id) }),
      },
    ],
  },
  {
    path: '/posts',
    component: RouterChild,
    children: [
      {
        name: 'posts',
        path: '',
        component: () => import(/* webpackChunkName: "admin-posts" */ '../../views/post/index'),
      },
      {
        name: 'post-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-posts" */ '../../views/post/design'),
      },
      {
        name: 'post-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-posts" */ '../../views/post/design'),
        props: (route) => ({ id: Number(route.params.id) }),
      },
    ],
  },
];
