import Vue from 'vue';
import VueMeta from 'vue-meta';
import { createRouter } from 'vue2-helpers/vue-router';
import { RouterChild } from '@/layouts/components';

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
      name: 'taxonomy',
      path: '/taxonomy/:id',
      component: () => import(/* webpackChunkName: "forms" */ '../views/taxonomy'),
      props: (route) => ({ id: route.params.id }),
    },
    {
      path: '/forms',
      component: RouterChild,
      children: [
        {
          name: 'forms',
          path: '',
          component: () => import(/* webpackChunkName: "forms" */ '../views/templates/forms'),
        },
        {
          name: 'form-add',
          path: 'add',
          component: () => import(/* webpackChunkName: "forms" */ '../views/templates/forms/design'),
        },
        {
          name: 'form-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "forms" */ '../views/templates/forms/design'),
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
          component: () => import(/* webpackChunkName: "pages" */ '../views/templates/pages'),
        },
        {
          name: 'page-add',
          path: 'add',
          component: () => import(/* webpackChunkName: "pages" */ '../views/templates/pages/design'),
        },
        {
          name: 'page-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "pages" */ '../views/templates/pages/design'),
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
          component: () => import(/* webpackChunkName: "posts" */ '../views/templates/posts'),
        },
        {
          name: 'post-add',
          path: 'add',
          component: () => import(/* webpackChunkName: "posts" */ '../views/templates/posts/design'),
        },
        {
          name: 'post-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "posts" */ '../views/templates/posts/design'),
          props: (route) => ({ id: route.params.id }),
        },
      ],
    },
    {
      path: '/data-scope',
      component: RouterChild,
      children: [
        {
          name: 'data-scopes',
          path: '',
          component: () => import(/* webpackChunkName: "data-scope" */ '../views/templates/data-scope'),
        },
        {
          name: 'data-scope-add',
          path: 'add',
          component: () => import(/* webpackChunkName: "data-scope" */ '../views/templates/data-scope/design'),
        },
        {
          name: 'data-scope-edit',
          path: ':id/edit',
          component: () => import(/* webpackChunkName: "data-scope" */ '../views/templates/data-scope/design'),
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
      name: 'session-timeout',
      path: '/session-timeout',
      component: () => import(/* webpackChunkName: "common" */ '../views/session-timeout'),
    },
  ],
});

const AnonymousRouteNames = ['signin', 'session-timeout'];

router.beforeEach((to, from, next) => {
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
