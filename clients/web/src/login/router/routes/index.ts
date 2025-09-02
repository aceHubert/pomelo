import { fallbackRoute } from '@/router/routes/fallback';
import { basicRoutes } from './basic';

export const routes = [...basicRoutes, fallbackRoute];
