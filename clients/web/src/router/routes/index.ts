import { basicRoutes } from './basic';
import { errorRoutes } from './errors';

export const routes = [
  ...basicRoutes,
  ...errorRoutes,
  {
    name: 'signout',
    path: '/signout',
  },
  {
    path: '*',
    // dymanic page or handle error page inside component
    component: () => import(/* webpackChunkName: "web-common" */ '@/views/page/index'),
  },
];
