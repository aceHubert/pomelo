import Vue from 'vue';
import VueMeta from 'vue-meta';
import { createRouter } from 'vue2-helpers/vue-router';
import { RouterChild } from '@/layouts/components';
import { Modal } from '@/components';

// Types
import type { MetaInfo, MetaInfoComputed } from 'vue-meta/types/vue-meta';

Vue.use(VueMeta, {
  keyName: 'head',
  tagIDKeyName: 'vmid',
  refreshOnceOnNavigation: true,
});

export const router = createRouter({
  base: '/',
  mode: 'history',
  routes: [
    {
      name: 'dashboard',
      path: '/',
      alias: ['/dashboard'],
      component: () => import(/* webpackChunkName: "common" */ '../views/dashboard'),
      meta: {
        breadcrumb: false,
      },
    },
    {
      name: 'media',
      path: '/medias',
      component: () => import(/* webpackChunkName: "medias" */ '../views/media'),
    },
    {
      name: 'category',
      path: '/categories',
      component: () => import(/* webpackChunkName: "posts" */ '../views/category'),
      props: (route) => ({ id: route.params.id }),
    },
    {
      name: 'tag',
      path: '/tags',
      component: () => import(/* webpackChunkName: "posts" */ '../views/tag'),
      props: (route) => ({ id: route.params.id }),
    },
    {
      path: '/forms',
      component: RouterChild,
      children: [
        {
          name: 'forms',
          path: '',
          component: () => import(/* webpackChunkName: "forms" */ '../views/form'),
        },
        {
          name: 'form-add',
          path: 'create',
          component: () => import(/* webpackChunkName: "forms" */ '../views/form/design'),
        },
        {
          name: 'form-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "forms" */ '../views/form/design'),
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
          component: () => import(/* webpackChunkName: "pages" */ '../views/page'),
        },
        {
          name: 'page-add',
          path: 'create',
          component: () => import(/* webpackChunkName: "pages" */ '../views/page/design'),
        },
        {
          name: 'page-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "pages" */ '../views/page/design'),
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
          component: () => import(/* webpackChunkName: "posts" */ '../views/post'),
        },
        {
          name: 'post-add',
          path: 'create',
          component: () => import(/* webpackChunkName: "posts" */ '../views/post/design'),
        },
        {
          name: 'post-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "posts" */ '../views/post/design'),
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
          component: () => import(/* webpackChunkName: "clients" */ '../views/client'),
        },
        {
          name: 'client-detail',
          path: ':clientId',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/detail'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-grant-types',
          path: ':clientId/grant-types',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/grant-types'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-scopes',
          path: ':clientId/scopes',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/scopes'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-claims',
          path: ':clientId/claims',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/claims'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-cors-origins',
          path: ':clientId/cors-origins',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/cors-origins'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-redirect-uris',
          path: ':clientId/redirect-uris',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/redirect-uris'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-post-logout-redirect-uris',
          path: ':clientId/post-logout-redirect-uris',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/post-logout-redirect-uris'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-secrets',
          path: ':clientId/secrets',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/secrets'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-secrets-generate',
          path: ':clientId/secrets/generate',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/secrets/generate'),
          props: (route) => ({ clientId: route.params.clientId }),
        },
        {
          name: 'client-properties',
          path: ':clientId/properties',
          component: () => import(/* webpackChunkName: "clients" */ '../views/client/properties'),
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
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource'),
        },
        {
          name: 'api-resource-detail',
          path: ':id',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/detail'),
          props: (route) => ({ id: Number(route.params.id) }),
        },
        {
          name: 'api-claims',
          path: ':id/claims',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/claims'),
          props: (route) => ({ apiResourceId: Number(route.params.id) }),
        },
        {
          name: 'api-scopes',
          path: ':id/scopes',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/scopes'),
          props: (route) => ({ apiResourceId: Number(route.params.id) }),
        },
        {
          name: 'api-scope-claims',
          path: '/api-scopes/:id/claims',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/scopes/claims'),
          props: (route) => ({ apiScopeId: Number(route.params.id) }),
        },
        {
          name: 'api-secrets',
          path: ':id/secrets',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/secrets'),
          props: (route) => ({ apiResourceId: Number(route.params.id) }),
        },
        {
          name: 'api-secrets-generate',
          path: ':id/secrets/generate',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/secrets/generate'),
          props: (route) => ({ apiResourceId: Number(route.params.id) }),
        },
        {
          name: 'api-properties',
          path: ':id/properties',
          component: () => import(/* webpackChunkName: "api-resources" */ '../views/api-resource/properties'),
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
          component: () => import(/* webpackChunkName: "identity-resources" */ '../views/identity-resource'),
        },
        {
          name: 'identity-resource-detail',
          path: ':id',
          component: () => import(/* webpackChunkName: "identity-resources" */ '../views/identity-resource/detail'),
          props: (route) => ({ id: Number(route.params.id) }),
        },
        {
          name: 'identity-claims',
          path: ':id/claims',
          component: () => import(/* webpackChunkName: "identity-resources" */ '../views/identity-resource/claims'),
          props: (route) => ({ identityResourceId: Number(route.params.id) }),
        },
        {
          name: 'identity-properties',
          path: ':id/properties',
          component: () => import(/* webpackChunkName: "identity-resources" */ '../views/identity-resource/properties'),
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
          component: () => import(/* webpackChunkName: "data-scope" */ '../views/data-scope'),
        },
        {
          name: 'data-scope-add',
          path: 'create',
          component: () => import(/* webpackChunkName: "data-scope" */ '../views/data-scope/design'),
        },
        {
          name: 'data-scope-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "data-scope" */ '../views/data-scope/design'),
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
          component: () => import(/* webpackChunkName: "sub-modules" */ '../views/submodules'),
          props: (route) => ({ name: route.query.search }),
        },
        {
          name: 'submodules-details',
          path: ':name',
          component: () => import(/* webpackChunkName: "sub-modules" */ '../views/submodules/details'),
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
      name: 'signout',
      path: '/signout',
    },
    {
      name: 'not-found',
      path: '*',
      component: () => import(/* webpackChunkName: "common" */ '../views/error/page-not-fount'),
    },
  ],
});

const AnonymousRouteNames = ['signin', 'session-timeout'];

router.beforeEach((to, from, next) => {
  Modal.destroyAll();
  const userManager = router.app.$userManager;
  if (to.name === 'signout') {
    userManager.signout();
  } else if ((to.name && AnonymousRouteNames.includes(to.name)) || to.meta?.anonymous === true) {
    next();
  } else {
    userManager.getUser().then(function (user) {
      if (user === null || user.expired) {
        userManager.signin({ noInteractive: true });
      } else {
        next();

        // if (user.profile.ut !== '1') {
        //   next({ name: '403.8', replace: true });
        // } else {
        //   next();
        //   // console.debug('route to ' + to.path)
        // }
      }
    });
  }
});

declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ComponentOptions<V extends Vue> {
    head?: MetaInfo | MetaInfoComputed;
  }
}
