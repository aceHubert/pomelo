import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/index';
import { LoginPage } from './pages/LoginPage/index';
import { ModifyPasswordPage } from './pages/ModifyPasswordPage/index';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage/index';
import { RegisterPage } from './pages/RegisterPage/index';
import { ResultPage } from './pages/ResultPage/index';
import { AUTH_BASENAME } from './services/app/env';
import {
  FORGOT_PASSWORD_ROUTE,
  LOGIN_ROUTE,
  MODIFY_PASSWORD_ROUTE,
  OAUTH_CALLBACK_ROUTE,
  REGISTER_ROUTE,
} from './services/navigation/routes';

export function App() {
  return (
    <BrowserRouter basename={AUTH_BASENAME}>
      <Routes>
        <Route path="/" element={<ResultPage />} />
        <Route path={LOGIN_ROUTE} element={<LoginPage />} />
        <Route path={REGISTER_ROUTE} element={<RegisterPage />} />
        <Route path={MODIFY_PASSWORD_ROUTE} element={<ModifyPasswordPage />} />
        <Route path={FORGOT_PASSWORD_ROUTE} element={<ForgotPasswordPage />} />
        <Route path={OAUTH_CALLBACK_ROUTE} element={<OAuthCallbackPage />} />
        <Route path="*" element={<Navigate to={LOGIN_ROUTE} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
