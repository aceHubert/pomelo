import { RouterChild } from '@/layouts/components';

// Types
import type { RouteConfig } from 'vue-router';

export const routes: Array<RouteConfig> = [
  {
    name: 'dashboard',
    path: '/',
    alias: ['/dashboard'],
    component: () => import(/* webpackChunkName: "admin-common" */ '../views/dashboard'),
    meta: {
      breadcrumb: false,
    },
  },
  {
    name: 'media',
    path: '/medias',
    component: () => import(/* webpackChunkName: "admin-medias" */ '../views/media'),
  },
  {
    name: 'category',
    path: '/categories',
    component: () => import(/* webpackChunkName: "admin-posts" */ '../views/category'),
    props: (route) => ({ id: route.params.id }),
  },
  {
    name: 'tag',
    path: '/tags',
    component: () => import(/* webpackChunkName: "admin-posts" */ '../views/tag'),
    props: (route) => ({ id: route.params.id }),
  },
  {
    path: '/forms',
    component: RouterChild,
    children: [
      {
        name: 'forms',
        path: '',
        component: () => import(/* webpackChunkName: "admin-forms" */ '../views/form'),
      },
      {
        name: 'form-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-forms" */ '../views/form/design'),
      },
      {
        name: 'form-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-forms" */ '../views/form/design'),
        props: (route) => ({ id: route.params.id }),
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
        component: () => import(/* webpackChunkName: "admin-pages" */ '../views/page'),
      },
      {
        name: 'page-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-pages" */ '../views/page/design'),
      },
      {
        name: 'page-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-pages" */ '../views/page/design'),
        props: (route) => ({ id: route.params.id }),
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
        component: () => import(/* webpackChunkName: "admin-posts" */ '../views/post'),
      },
      {
        name: 'post-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-posts" */ '../views/post/design'),
      },
      {
        name: 'post-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-posts" */ '../views/post/design'),
        props: (route) => ({ id: route.params.id }),
      },
    ],
  },
  {
    path: '/clients',
    component: RouterChild,
    children: [
      {
        name: 'clients',
        path: '',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client'),
      },
      {
        name: 'client-detail',
        path: ':clientId',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/detail'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-grant-types',
        path: ':clientId/grant-types',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/grant-types'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-scopes',
        path: ':clientId/scopes',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/scopes'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-claims',
        path: ':clientId/claims',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/claims'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-cors-origins',
        path: ':clientId/cors-origins',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/cors-origins'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-redirect-uris',
        path: ':clientId/redirect-uris',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/redirect-uris'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-post-logout-redirect-uris',
        path: ':clientId/post-logout-redirect-uris',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/post-logout-redirect-uris'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-secrets',
        path: ':clientId/secrets',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/secrets'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-secrets-generate',
        path: ':clientId/secrets/generate',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/secrets/generate'),
        props: (route) => ({ clientId: route.params.clientId }),
      },
      {
        name: 'client-properties',
        path: ':clientId/properties',
        component: () => import(/* webpackChunkName: "admin-clients" */ '../views/client/properties'),
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
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource'),
      },
      {
        name: 'api-resource-detail',
        path: ':id',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/detail'),
        props: (route) => ({ id: route.params.id }),
      },
      {
        name: 'api-claims',
        path: ':id/claims',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/claims'),
        props: (route) => ({ apiResourceId: route.params.id }),
      },
      {
        name: 'api-scopes',
        path: ':id/scopes',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/scopes'),
        props: (route) => ({ apiResourceId: route.params.id }),
      },
      {
        name: 'api-scope-claims',
        path: '/api-scopes/:scopeId/claims',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/scopes/claims'),
        props: (route) => ({ apiScopeId: route.params.scopeId }),
      },
      {
        name: 'api-secrets',
        path: ':id/secrets',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/secrets'),
        props: (route) => ({ apiResourceId: route.params.id }),
      },
      {
        name: 'api-secrets-generate',
        path: ':id/secrets/generate',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/secrets/generate'),
        props: (route) => ({ apiResourceId: route.params.id }),
      },
      {
        name: 'api-properties',
        path: ':id/properties',
        component: () => import(/* webpackChunkName: "admin-api-resources" */ '../views/api-resource/properties'),
        props: (route) => ({ apiResourceId: route.params.id }),
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
        component: () => import(/* webpackChunkName: "admin-identity-resources" */ '../views/identity-resource'),
      },
      {
        name: 'identity-resource-detail',
        path: ':id',
        component: () => import(/* webpackChunkName: "admin-identity-resources" */ '../views/identity-resource/detail'),
        props: (route) => ({ id: route.params.id }),
      },
      {
        name: 'identity-claims',
        path: ':id/claims',
        component: () => import(/* webpackChunkName: "admin-identity-resources" */ '../views/identity-resource/claims'),
        props: (route) => ({ identityResourceId: route.params.id }),
      },
      {
        name: 'identity-properties',
        path: ':id/properties',
        component: () =>
          import(/* webpackChunkName: "admin-identity-resources" */ '../views/identity-resource/properties'),
        props: (route) => ({ identityResourceId: route.params.id }),
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
        component: () => import(/* webpackChunkName: "admin-data-scope" */ '../views/data-scope'),
      },
      {
        name: 'data-scope-add',
        path: 'create',
        component: () => import(/* webpackChunkName: "admin-data-scope" */ '../views/data-scope/design'),
      },
      {
        name: 'data-scope-edit',
        path: ':id/edit',
        component: () => import(/* webpackChunkName: "admin-data-scope" */ '../views/data-scope/design'),
        props: (route) => ({ id: route.params.id }),
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
        component: () => import(/* webpackChunkName: "admin-sub-modules" */ '../views/submodules'),
        props: (route) => ({ name: route.query.search }),
      },
      {
        name: 'submodules-details',
        path: ':name',
        component: () => import(/* webpackChunkName: "admin-sub-modules" */ '../views/submodules/details'),
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
        component: () => import(/* webpackChunkName: "settings" */ '../views/settings/auth-type'),
      },
      {
        name: 'cache-clear',
        path: 'cache-clear',
        component: () => import(/* webpackChunkName: "settings" */ '../views/settings/cache-clear'),
      },
    ],
  },
  {
    name: 'signout',
    path: '/signout',
  },
  {
    name: 'forbidden',
    path: '/forbidden',
    component: () => import(/* webpackChunkName: "admin-common" */ '../../views/error/forbidden'),
    meta: {
      anonymous: true,
    },
  },
  {
    name: 'not-found',
    path: '*',
    component: () => import(/* webpackChunkName: "admin-common" */ '../../views/error/page-not-fount'),
    meta: {
      anonymous: true,
    },
  },
];
