import { RouterChild } from '@/layouts/components';

// Types
import type { RouteConfig } from 'vue-router';

export const settingRoutes: Array<RouteConfig> = [
  {
    path: '/data-scopes',
    component: RouterChild,
    children: [
      {
        name: 'data-scopes',
        path: '',
        component: () => import(/* webpackChunkName: "admin-data-scope" */ '../../views/data-scope/index'),
      },
      {
        name: 'data-scope-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-data-scope" */ '../../views/data-scope/design/index'),
      },
      {
        name: 'data-scope-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-data-scope" */ '../../views/data-scope/design/index'),
        props: (route) => ({ id: Number(route.params.id) }),
      },
    ],
  },
  {
    path: '/settings',
    component: RouterChild,
    children: [
      {
        name: 'cache-clear',
        path: 'cache-clear',
        component: () => import(/* webpackChunkName: "admin-settings" */ '../../views/settings/cache-clear'),
      },
    ],
  },
];
