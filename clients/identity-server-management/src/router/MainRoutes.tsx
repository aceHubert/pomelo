import { Navigate, useRoutes } from 'react-router-dom';
import { ApiResourcesPage } from '@/pages/ApiResourcesPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { IdentityResourcesPage } from '@/pages/IdentityResourcesPage';
import type { Location } from 'react-router-dom';

const mainRoutes = [
  { path: '/', element: <Navigate to="/clients" replace /> },
  { path: '/clients', element: <ClientsPage /> },
  { path: '/api-resources', element: <ApiResourcesPage /> },
  { path: '/identity-resources', element: <IdentityResourcesPage /> },
  { path: '*', element: <Navigate to="/clients" replace /> },
];

export function MainRoutes({ location }: { location?: Location }) {
  return useRoutes(mainRoutes, location);
}
