import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';

export function ProtectedRoute({ token, children }: { token: string | null; children: ReactElement }) {
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
