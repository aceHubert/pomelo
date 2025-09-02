import { errorRoutes } from '@/router/routes/errors';
import { fallbackRoute } from '@/router/routes/fallback';
import { basicRoutes } from './basic';
import { settingRoutes } from './setting';
import { identityRoutes } from './identity';

export const routes = [
  ...basicRoutes,
  ...settingRoutes,
  ...identityRoutes,
  ...errorRoutes,
  {
    name: 'signout',
    path: '/signout',
  },
  fallbackRoute,
];
