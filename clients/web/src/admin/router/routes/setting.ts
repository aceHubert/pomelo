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
    path: '/submodules',
    component: RouterChild,
    children: [
      {
        name: 'submodules',
        path: '',
        component: () => import(/* webpackChunkName: "admin-sub-modules" */ '../../views/submodules/index'),
        props: (route) => ({ name: route.query.search }),
      },
      {
        name: 'submodules-details',
        path: ':name',
        component: () => import(/* webpackChunkName: "admin-sub-modules" */ '../../views/submodules/details'),
        props: (route) => {
          return {
            name: route.params.name,
            version: route.query.version,
          };
        },
      },
    ],
  },
  {
    path: '/settings',
    component: RouterChild,
    children: [
      {
        name: 'auth-type',
        path: 'auth-type',
        component: () => import(/* webpackChunkName: "settings" */ '../../views/settings/auth-type'),
      },
      {
        name: 'cache-clear',
        path: 'cache-clear',
        component: () => import(/* webpackChunkName: "settings" */ '../../views/settings/cache-clear'),
      },
    ],
  },
];
