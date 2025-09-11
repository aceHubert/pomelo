import { RouterChild } from '@/layouts/components';

// Types
import type { RouteConfig } from 'vue-router';

export const submoduleRoutes: Array<RouteConfig> = [
  {
    path: '/submodules',
    component: RouterChild,
    children: [
      {
        name: 'submodules',
        path: '',
        component: () => import(/* webpackChunkName: "admin-submodules-views" */ '../../views/submodules/index'),
        props: (route) => ({ name: route.query.search }),
      },
      {
        name: 'submodules-details',
        path: ':name',
        component: () => import(/* webpackChunkName: "admin-submodules-views" */ '../../views/submodules/details'),
        props: (route) => {
          return {
            name: route.params.name,
            version: route.query.version,
          };
        },
      },
    ],
  },
];
