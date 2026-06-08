import { Outlet, RouterProvider, createHashRouter } from 'react-router-dom';
import { useMemo } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './router/ProtectedRoute';

function RootShell() {
  return <Outlet />;
}

export function App({
  token,
  onLogin,
  onLogout,
}: {
  token: string | null;
  onLogin: (token: string) => void;
  onLogout: () => void;
}) {
  const router = useMemo(
    () =>
      createHashRouter([
        {
          element: <RootShell />,
          children: [
            { path: '/login', element: <LoginPage onLogin={onLogin} /> },
            {
              path: '/*',
              element: (
                <ProtectedRoute token={token}>
                  <MainLayout onLogout={onLogout} />
                </ProtectedRoute>
              ),
            },
          ],
        },
      ]),
    [onLogin, onLogout, token],
  );

  return <RouterProvider router={router} />;
}
