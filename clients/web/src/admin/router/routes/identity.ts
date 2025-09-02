import { RouterChild } from '@/layouts/components';

// Types
import type { RouteConfig } from 'vue-router';

export const identityRoutes: Array<RouteConfig> = [
  {
    path: '/clients',
    component: RouterChild,
    children: [
      {
        name: 'clients',
        path: '',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/index'),
      },
      {
        name: 'client-detail',
        path: ':clientId',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/detail'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-grant-types',
        path: ':clientId/grant-types',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/grant-types'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-scopes',
        path: ':clientId/scopes',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/scopes'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-claims',
        path: ':clientId/claims',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/claims'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-cors-origins',
        path: ':clientId/cors-origins',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/cors-origins'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-redirect-uris',
        path: ':clientId/redirect-uris',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/redirect-uris'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-post-logout-redirect-uris',
        path: ':clientId/post-logout-redirect-uris',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/post-logout-redirect-uris'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-secrets',
        path: ':clientId/secrets',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/secrets/index'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-secrets-generate',
        path: ':clientId/secrets/generate',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/secrets/generate'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-properties',
        path: ':clientId/properties',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../../views/client/properties'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
    ],
  },
  {
    path: '/api-resources',
    component: RouterChild,
    children: [
      {
        name: 'api-resources',
        path: '',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/index'),
      },
      {
        name: 'api-resource-detail',
        path: ':id',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/detail'),
        props: (route) => ({ id: Number(route.params.id) }),
      },
      {
        name: 'api-claims',
        path: ':id/claims',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/claims'),
        props: (route) => ({ apiResourceId: Number(route.params.id) }),
      },
      {
        name: 'api-scopes',
        path: ':id/scopes',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/scopes/index'),
        props: (route) => ({ apiResourceId: Number(route.params.id) }),
      },
      {
        name: 'api-scope-claims',
        path: '/api-scopes/:scopeId/claims',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/scopes/claims'),
        props: (route) => ({ apiScopeId: Number(route.params.scopeId) }),
      },
      {
        name: 'api-secrets',
        path: ':id/secrets',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/secrets/index'),
        props: (route) => ({ apiResourceId: Number(route.params.id) }),
      },
      {
        name: 'api-secrets-generate',
        path: ':id/secrets/generate',
        component: () =>
          import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/secrets/generate'),
        props: (route) => ({ apiResourceId: Number(route.params.id) }),
      },
      {
        name: 'api-properties',
        path: ':id/properties',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../../views/api-resource/properties'),
        props: (route) => ({ apiResourceId: Number(route.params.id) }),
      },
    ],
  },
  {
    path: '/identity-resources',
    component: RouterChild,
    children: [
      {
        name: 'identity-resources',
        path: '',
        component: () =>
          import(/* webpackChunkName: "admin-identity-resources" */ '../../views/identity-resource/index'),
      },
      {
        name: 'identity-resource-detail',
        path: ':id',
        component: () =>
          import(/* webpackChunkName: "admin-identity-resources" */ '../../views/identity-resource/detail'),
        props: (route) => ({ id: Number(route.params.id) }),
      },
      {
        name: 'identity-claims',
        path: ':id/claims',
        component: () =>
          import(/* webpackChunkName: "admin-identity-resources" */ '../../views/identity-resource/claims'),
        props: (route) => ({ identityResourceId: Number(route.params.id) }),
      },
      {
        name: 'identity-properties',
        path: ':id/properties',
        component: () =>
          import(/* webpackChunkName: "admin-identity-resources" */ '../../views/identity-resource/properties'),
        props: (route) => ({ identityResourceId: Number(route.params.id) }),
      },
    ],
  },
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
];
