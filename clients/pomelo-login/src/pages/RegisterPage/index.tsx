import { Alert, App as AntdApp, Button, Form, Input, Select, Spin } from 'antd';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AUTOLOAD_OPTIONS, REGISTER, REGISTER_USERNAME_AVAILABLE, SEND_REGISTER_EMAIL_CODE } from '@/apis/operations';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrength';
import { APP_TITLE } from '@/services/app/env';
import { sha256Hex } from '@/services/auth/hash';
import { clearStoredAuthToken } from '@/services/auth/token';
import { formatError } from '@/services/graphql/errors';
import { useI18n } from '@/services/i18n/i18n';
import { LOGIN_ROUTE } from '@/services/navigation/routes';
import type {
  AutoloadOptionsQueryData,
  RegisterEmailCodeMutationData,
  RegisterEmailCodeMutationVariables,
  RegisterMutationData,
  RegisterMutationVariables,
  RegisterUsernameAvailableQueryData,
  RegisterUsernameAvailableQueryVariables,
} from '@/apis/operations';

type RegisterFormValues = {
  emailName: string;
  emailSuffix: string;
  code: string;
  username: string;
  password: string;
  confirmPassword: string;
};

type UsernameAvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

const USERNAME_CHECK_DEBOUNCE_MS = 400;
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,32}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
const DEFAULT_EMAIL_SUFFIXES = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'qq.com',
  'foxmail.com',
  '163.com',
  '126.com',
  'icloud.com',
];

function parseEmailSuffixes(value: string | undefined) {
  const suffixes = (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase().replace(/^@+/, ''))
    .filter(Boolean);

  return suffixes.length ? suffixes : DEFAULT_EMAIL_SUFFIXES;
}

function normalizeUsername(value: string | undefined) {
  return (value ?? '').trim();
}

function buildEmail(values: Pick<RegisterFormValues, 'emailName' | 'emailSuffix'>) {
  return `${values.emailName.trim()}@${values.emailSuffix}`.toLowerCase();
}

export function RegisterPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<RegisterFormValues>();
  const watchedUsername = Form.useWatch('username', form);
  const watchedPassword = Form.useWatch('password', form);
  const [submitError, setSubmitError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [usernameAvailability, setUsernameAvailability] = useState<{
    username: string;
    status: UsernameAvailabilityStatus;
  }>({ username: '', status: 'idle' });
  const { data: optionsData, loading: optionsLoading } = useQuery<AutoloadOptionsQueryData>(AUTOLOAD_OPTIONS);
  const [checkRegisterUsernameAvailable] = useLazyQuery<
    RegisterUsernameAvailableQueryData,
    RegisterUsernameAvailableQueryVariables
  >(REGISTER_USERNAME_AVAILABLE, { fetchPolicy: 'no-cache' });
  const [sendRegisterEmailCode, { loading: sendingCode }] = useMutation<
    RegisterEmailCodeMutationData,
    RegisterEmailCodeMutationVariables
  >(SEND_REGISTER_EMAIL_CODE);
  const [register, { loading: registering }] = useMutation<RegisterMutationData, RegisterMutationVariables>(REGISTER);

  useEffect(() => {
    document.title = `${t('register.title')} | ${APP_TITLE}`;
  }, [t]);

  useEffect(() => {
    clearStoredAuthToken();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const registerEnabled = optionsData?.result?.['auth-register-enable'] === '1';
  const emailSuffixes = useMemo(
    () => parseEmailSuffixes(optionsData?.result?.['auth-register-email-suffixes']),
    [optionsData?.result],
  );
  const passwordStrengthLabels = {
    weak: t('register.passwordStrengthWeak'),
    medium: t('register.passwordStrengthMedium'),
    strong: t('register.passwordStrengthStrong'),
  };
  const usernameValidateStatus: 'success' | 'warning' | 'error' | 'validating' | undefined =
    usernameAvailability.status === 'checking'
      ? 'validating'
      : usernameAvailability.status === 'available'
      ? 'success'
      : usernameAvailability.status === 'unavailable' || usernameAvailability.status === 'error'
      ? 'error'
      : undefined;
  const usernameHelp =
    usernameAvailability.status === 'checking'
      ? t('register.usernameChecking')
      : usernameAvailability.status === 'available'
      ? t('register.usernameAvailable')
      : usernameAvailability.status === 'unavailable'
      ? t('register.usernameUnavailable')
      : usernameAvailability.status === 'error'
      ? t('register.usernameCheckError')
      : undefined;

  useEffect(() => {
    const currentSuffix = form.getFieldValue('emailSuffix');
    if (!currentSuffix || !emailSuffixes.includes(currentSuffix)) {
      form.setFieldsValue({ emailSuffix: emailSuffixes[0] });
    }
  }, [emailSuffixes, form]);

  useEffect(() => {
    const username = normalizeUsername(watchedUsername);
    if (!username) {
      setUsernameAvailability({ username: '', status: 'idle' });
      return;
    }

    let canceled = false;
    setUsernameAvailability({ username, status: 'idle' });

    const timer = window.setTimeout(async () => {
      try {
        await form.validateFields(['username'], { validateOnly: true });
        if (canceled) return;

        setUsernameAvailability({ username, status: 'checking' });
        const { data } = await checkRegisterUsernameAvailable({ variables: { username } });
        if (!canceled) {
          if (data?.result) {
            form.setFields([{ name: 'username', errors: [] }]);
          }
          setUsernameAvailability({
            username,
            status: data?.result ? 'available' : 'unavailable',
          });
        }
      } catch (error) {
        if (!canceled) {
          const isValidationError =
            typeof error === 'object' &&
            error !== null &&
            'errorFields' in error &&
            Array.isArray((error as { errorFields?: unknown }).errorFields);
          setUsernameAvailability({ username, status: isValidationError ? 'idle' : 'error' });
        }
      }
    }, USERNAME_CHECK_DEBOUNCE_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
    };
  }, [checkRegisterUsernameAvailable, form, watchedUsername]);

  async function ensureUsernameAvailable(username: string) {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) {
      return false;
    }

    await form.validateFields(['username']);
    setUsernameAvailability({ username: normalizedUsername, status: 'checking' });

    try {
      const { data } = await checkRegisterUsernameAvailable({ variables: { username: normalizedUsername } });
      const available = data?.result === true;
      if (available) {
        form.setFields([{ name: 'username', errors: [] }]);
      }
      setUsernameAvailability({
        username: normalizedUsername,
        status: available ? 'available' : 'unavailable',
      });
      return available;
    } catch {
      setUsernameAvailability({ username: normalizedUsername, status: 'error' });
      return false;
    }
  }

  async function handleSendCode() {
    setSubmitError('');

    try {
      const values = await form.validateFields(['emailName', 'emailSuffix']);
      const { data } = await sendRegisterEmailCode({
        variables: {
          model: {
            email: buildEmail(values),
          },
        },
      });
      setCooldown(data?.result?.cooldownSeconds || 60);
      message.success(data?.result?.message || t('register.codeSent'));
    } catch (error) {
      setSubmitError(formatError(error, t('register.codeSendError')).message);
    }
  }

  async function handleSubmit(values: RegisterFormValues) {
    setSubmitError('');

    try {
      const username = normalizeUsername(values.username);
      const usernameAvailable = await ensureUsernameAvailable(username);
      if (!usernameAvailable) {
        form.setFields([{ name: 'username', errors: [t('register.usernameUnavailable')] }]);
        return;
      }

      const password = await sha256Hex(values.password);
      const { data } = await register({
        variables: {
          model: {
            email: buildEmail(values),
            code: values.code,
            username,
            password,
          },
        },
      });

      if (!data?.result?.success) {
        setSubmitError(data?.result?.message || t('register.error'));
        return;
      }

      message.success({
        content: t('register.success'),
        duration: 1,
        onClose: () => navigate({ pathname: LOGIN_ROUTE, search: location.search }, { replace: true }),
      });
    } catch (error) {
      setSubmitError(formatError(error, t('register.error')).message);
    }
  }

  if (optionsLoading) {
    return (
      <AuthShell>
        <div className="auth-centered">
          <Spin />
        </div>
      </AuthShell>
    );
  }

  if (!registerEnabled) {
    return (
      <AuthShell title={t('register.closedTitle')} subtitle={t('register.closedSubtitle')}>
        <div className="auth-button-stack">
          <Alert message={t('register.closedMessage')} type="info" showIcon />
          <Link to={{ pathname: LOGIN_ROUTE, search: location.search }}>
            <Button block color="default" variant="solid" shape="round" size="large">
              {t('common.backToLogin')}
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('register.title')} subtitle={t('register.subtitle')}>
      <Form<RegisterFormValues>
        className="auth-form"
        form={form}
        initialValues={{ emailSuffix: emailSuffixes[0] }}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={t('register.email')}
          name="emailName"
          validateFirst
          rules={[
            { required: true, message: t('register.emailPlaceholder') },
            { pattern: /^[^@\s]+$/, message: t('register.emailInvalid') },
          ]}
        >
          <Input
            addonAfter={
              <Form.Item name="emailSuffix" noStyle>
                <Select
                  className="auth-email-suffix-select"
                  popupMatchSelectWidth={false}
                  options={emailSuffixes.map((suffix) => ({
                    label: `@${suffix}`,
                    value: suffix,
                  }))}
                />
              </Form.Item>
            }
            autoComplete="email"
            placeholder={t('register.emailNamePlaceholder')}
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="code"
          label={t('register.code')}
          rules={[{ required: true, message: t('register.codePlaceholder') }]}
        >
          <Input
            autoComplete="one-time-code"
            placeholder={t('register.codePlaceholder')}
            size="large"
            suffix={
              <Button
                className="auth-input-action"
                disabled={cooldown > 0}
                loading={sendingCode}
                shape="round"
                size="small"
                type="text"
                onClick={handleSendCode}
                onMouseDown={(event) => event.preventDefault()}
              >
                {cooldown > 0 ? t('register.cooldown', { seconds: cooldown }) : t('register.sendCode')}
              </Button>
            }
          />
        </Form.Item>
        <Form.Item
          name="username"
          label={t('register.username')}
          help={usernameHelp}
          validateFirst
          rules={[
            { required: true, message: t('register.usernamePlaceholder') },
            { pattern: USERNAME_PATTERN, message: t('register.usernameInvalid') },
          ]}
          validateStatus={usernameValidateStatus}
        >
          <Input autoComplete="username" placeholder={t('register.usernamePlaceholder')} size="large" />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('register.password')}
          validateFirst
          rules={[
            { required: true, message: t('register.passwordPlaceholder') },
            { min: 6, message: t('register.passwordMin', { min: 6 }) },
            { pattern: PASSWORD_PATTERN, message: t('register.passwordComplexity') },
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder={t('register.passwordPlaceholder')} size="large" />
        </Form.Item>
        <PasswordStrengthIndicator password={watchedPassword} labels={passwordStrengthLabels} />
        <Form.Item
          name="confirmPassword"
          label={t('register.confirmPassword')}
          dependencies={['password']}
          validateFirst
          rules={[
            { required: true, message: t('register.confirmPasswordPlaceholder') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('register.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={t('register.confirmPasswordPlaceholder')}
            size="large"
          />
        </Form.Item>
        {submitError ? <Alert message={submitError} type="error" showIcon /> : null}
        <Button
          block
          color="default"
          variant="solid"
          htmlType="submit"
          loading={registering}
          shape="round"
          size="large"
        >
          {t('register.submit')}
        </Button>
        <Button
          block
          type="link"
          htmlType="button"
          shape="round"
          size="large"
          className="auth-secondary-button"
          onClick={() => navigate({ pathname: LOGIN_ROUTE, search: location.search })}
        >
          {t('common.backToLogin')}
        </Button>
      </Form>
    </AuthShell>
  );
}
