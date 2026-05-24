import { errorRoutes } from '@/router/routes/errors';
import { fallbackRoute } from '@/router/routes/fallback';
import { basicRoutes } from './basic';
import { settingRoutes } from './setting';
import { submoduleRoutes } from './submodule';
import { oidcRoutes } from './oidc';

export const routes = [
  ...basicRoutes,
  ...settingRoutes,
  ...submoduleRoutes,
  ...oidcRoutes,
  ...errorRoutes,
  {
    name: 'signout',
    path: '/signout',
  },
  fallbackRoute,
];
