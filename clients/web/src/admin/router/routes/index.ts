import { errorRoutes } from '@/router/routes/errors';
import { fallbackRoute } from '@/router/routes/fallback';
import { basicRoutes } from './basic';

export const routes = [
  ...basicRoutes,
  ...errorRoutes,
  {
    name: 'signout',
    path: '/signout',
  },
  fallbackRoute,
];
