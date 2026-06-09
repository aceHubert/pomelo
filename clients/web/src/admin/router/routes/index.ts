import { errorRoutes } from '@/router/routes/errors';
import { fallbackRoute } from '@/router/routes/fallback';
import { basicRoutes } from './basic';
import { settingRoutes } from './setting';
import { submoduleRoutes } from './submodule';

export const routes = [
  ...basicRoutes,
  ...settingRoutes,
  ...submoduleRoutes,
  ...errorRoutes,
  {
    name: 'signout',
    path: '/signout',
  },
  fallbackRoute,
];
