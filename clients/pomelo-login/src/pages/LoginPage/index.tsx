import { Alert, App as AntdApp, Button, Checkbox, Form, Input } from 'antd';
import { useMutation } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SIGN_IN } from '@/apis/operations';
import { AuthShell } from '@/components/auth/AuthShell';
import { APP_TITLE } from '@/services/app/env';
import { sha256Hex } from '@/services/auth/hash';
import { clearStoredAuthToken, setStoredAuthToken } from '@/services/auth/token';
import { formatError } from '@/services/graphql/errors';
import { useI18n } from '@/services/i18n/i18n';
import {
  FORGOT_PASSWORD_ROUTE,
  getCurrentFullPath,
  redirectTo,
  resolveReturnTarget,
  toSearch,
} from '@/services/navigation/routes';
import type { SignInMutationData, SignInMutationVariables } from '@/apis/operations';

type LoginFormValues = {
  username: string;
  password: string;
  remember: boolean;
};

export function LoginPage() {
  const { t } = useI18n();
  const location = useLocation();
  const { message } = AntdApp.useApp();
  const [submitError, setSubmitError] = useState('');
  const [signIn, { loading }] = useMutation<SignInMutationData, SignInMutationVariables>(SIGN_IN);

  useEffect(() => {
    document.title = `${t('login.title')} | ${APP_TITLE}`;
  }, [t]);

  useEffect(() => {
    clearStoredAuthToken();
  }, []);

  const forgotPasswordSearch = useMemo(
    () => toSearch({ returnUrl: getCurrentFullPath() }),
    [location.pathname, location.search, location.hash],
  );

  async function handleSubmit(values: LoginFormValues) {
    setSubmitError('');

    try {
      const password = await sha256Hex(values.password);
      const { data } = await signIn({
        variables: {
          model: {
            username: values.username,
            password,
          },
        },
      });

      if (!data?.result?.success) {
        setSubmitError(data?.result?.message || t('login.error'));
        return;
      }

      setStoredAuthToken(data.result.accessToken, data.result.tokenType, values.remember);
      message.success({
        content: t('login.success'),
        duration: 1,
        onClose: () => redirectTo(resolveReturnTarget(location.search, 'login-success')),
      });
    } catch (error) {
      setSubmitError(formatError(error, t('login.error')).message);
    }
  }

  return (
    <AuthShell title={t('login.title')} subtitle={t('login.subtitle')}>
      <Form<LoginFormValues> className="auth-form" layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <Form.Item
          name="username"
          label={t('login.username')}
          rules={[{ required: true, message: t('login.usernamePlaceholder') }]}
        >
          <Input autoComplete="username" placeholder={t('login.usernamePlaceholder')} size="large" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('login.password')}
          rules={[{ required: true, message: t('login.passwordPlaceholder') }]}
        >
          <Input.Password autoComplete="current-password" placeholder={t('login.passwordPlaceholder')} size="large" />
        </Form.Item>
        <div className="auth-helper-row">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{t('login.rememberMe')}</Checkbox>
          </Form.Item>
          <Link className="auth-helper-link" to={{ pathname: FORGOT_PASSWORD_ROUTE, search: forgotPasswordSearch }}>
            {t('login.forgotPassword')}
          </Link>
        </div>
        {submitError ? <Alert message={submitError} type="error" showIcon /> : null}
        <Button block type="primary" htmlType="submit" loading={loading} shape="round" size="large" className="mt-3">
          {t('login.submit')}
        </Button>
      </Form>
    </AuthShell>
  );
}
