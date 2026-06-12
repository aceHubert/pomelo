import { GithubOutlined, GlobalOutlined, GoogleOutlined } from '@ant-design/icons';
import { Alert, App as AntdApp, Button, Checkbox, Divider, Form, Input } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AUTOLOAD_OPTIONS, SIGN_IN, START_SOCIAL_AUTH, toGraphqlAuthProvider } from '@/apis/operations';
import { AuthShell } from '@/components/auth/AuthShell';
import { APP_TITLE, BRAND_NAME } from '@/services/app/env';
import { sha256Hex } from '@/services/auth/hash';
import { clearStoredAuthToken, setStoredAuthToken } from '@/services/auth/token';
import { formatError } from '@/services/graphql/errors';
import { useI18n } from '@/services/i18n/i18n';
import {
  FORGOT_PASSWORD_ROUTE,
  REGISTER_ROUTE,
  getCurrentFullPath,
  getReturnUrl,
  redirectTo,
  resolveReturnTarget,
  toSearch,
} from '@/services/navigation/routes';
import type {
  AuthProvider,
  AutoloadOptionsQueryData,
  SignInMutationData,
  SignInMutationVariables,
  SocialAuthStartMutationData,
  SocialAuthStartMutationVariables,
} from '@/apis/operations';

type LoginFormValues = {
  username: string;
  password: string;
  remember: boolean;
};

export function LoginPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [submitError, setSubmitError] = useState('');
  const [activeProvider, setActiveProvider] = useState<AuthProvider | ''>('');
  const { data: optionsData } = useQuery<AutoloadOptionsQueryData>(AUTOLOAD_OPTIONS);
  const [signIn, { loading }] = useMutation<SignInMutationData, SignInMutationVariables>(SIGN_IN);
  const [startSocialAuth] = useMutation<SocialAuthStartMutationData, SocialAuthStartMutationVariables>(
    START_SOCIAL_AUTH,
  );

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
  const registerSearch = useMemo(() => location.search, [location.search]);
  const autoloadOptions = optionsData?.result ?? {};
  const registerEnabled = autoloadOptions['auth-register-enable'] === '1';
  const socialProviders = [
    {
      provider: 'google' as const,
      enabled: autoloadOptions['auth-google-enable'] === '1',
      label: t('social.google'),
      icon: <GoogleOutlined />,
    },
    {
      provider: 'github' as const,
      enabled: autoloadOptions['auth-github-enable'] === '1',
      label: t('social.github'),
      icon: <GithubOutlined />,
    },
    {
      provider: 'linuxdo' as const,
      enabled: autoloadOptions['auth-linuxdo-enable'] === '1',
      label: t('social.linuxDo'),
      icon: <GlobalOutlined />,
    },
  ].filter(({ enabled }) => enabled);

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

  async function handleSocialAuth(provider: AuthProvider) {
    setSubmitError('');
    setActiveProvider(provider);

    try {
      const { data } = await startSocialAuth({
        variables: {
          model: {
            provider: toGraphqlAuthProvider(provider),
            returnUrl: getReturnUrl(location.search) || undefined,
          },
        },
      });

      if (data?.result?.authorizationUrl) {
        redirectTo(data.result.authorizationUrl);
        return;
      }

      setSubmitError(t('social.startError'));
    } catch (error) {
      setSubmitError(formatError(error, t('social.startError')).message);
    } finally {
      setActiveProvider('');
    }
  }

  return (
    <AuthShell title={t('login.title')} subtitle={t('login.subtitle', { brandName: BRAND_NAME })}>
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
          <div className="auth-helper-links">
            <Link className="auth-helper-link" to={{ pathname: FORGOT_PASSWORD_ROUTE, search: forgotPasswordSearch }}>
              {t('login.forgotPassword')}
            </Link>
          </div>
        </div>
        {submitError ? <Alert message={submitError} type="error" showIcon /> : null}
        <Button
          block
          color="default"
          variant="solid"
          htmlType="submit"
          loading={loading}
          shape="round"
          size="large"
          className="mt-3"
        >
          {t('login.submit')}
        </Button>
        {registerEnabled || socialProviders.length ? (
          <div className="auth-social-section">
            <Divider plain>{t('social.divider')}</Divider>
            <div className="auth-social-buttons">
              {registerEnabled ? (
                <Button
                  block
                  color="default"
                  shape="round"
                  size="large"
                  variant="solid"
                  onClick={() => navigate({ pathname: REGISTER_ROUTE, search: registerSearch })}
                >
                  {t('login.register')}
                </Button>
              ) : null}
              {socialProviders.map(({ provider, label, icon }) => (
                <Button
                  key={provider}
                  block
                  color="default"
                  icon={icon}
                  loading={activeProvider === provider}
                  shape="round"
                  size="large"
                  variant="solid"
                  onClick={() => handleSocialAuth(provider)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </Form>
    </AuthShell>
  );
}
