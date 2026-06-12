import { Alert, App as AntdApp, Button, Form, Input } from 'antd';
import { useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RESET_PASSWORD,
  SEND_FORGOT_PASSWORD_EMAIL_CODE,
  type ForgotPasswordEmailCodeMutationData,
  type ForgotPasswordEmailCodeMutationVariables,
  type ResetPasswordMutationData,
  type ResetPasswordMutationVariables,
} from '@/apis/operations';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrength';
import { APP_TITLE } from '@/services/app/env';
import { sha256Hex } from '@/services/auth/hash';
import { formatError } from '@/services/graphql/errors';
import { useI18n } from '@/services/i18n/i18n';
import { LOGIN_ROUTE, redirectTo, resolveReturnTarget } from '@/services/navigation/routes';

type ForgotPasswordFormValues = {
  username: string;
  code: string;
  password: string;
  confirmPassword: string;
};

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<ForgotPasswordFormValues>();
  const watchedPassword = Form.useWatch('password', form);
  const [submitError, setSubmitError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sendForgotPasswordEmailCode, { loading: sendingCode }] = useMutation<
    ForgotPasswordEmailCodeMutationData,
    ForgotPasswordEmailCodeMutationVariables
  >(SEND_FORGOT_PASSWORD_EMAIL_CODE);
  const [resetPassword, { loading: resetting }] = useMutation<
    ResetPasswordMutationData,
    ResetPasswordMutationVariables
  >(RESET_PASSWORD);

  useEffect(() => {
    document.title = `${t('forgot.title')} | ${APP_TITLE}`;
  }, [t]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleSendCode() {
    setSubmitError('');

    try {
      const values = await form.validateFields(['username']);
      const { data } = await sendForgotPasswordEmailCode({
        variables: {
          model: {
            username: values.username.trim(),
          },
        },
      });
      setCooldown(data?.result?.cooldownSeconds || 60);
      message.success(t('forgot.codeSent', { email: data?.result?.maskedEmail || '' }));
    } catch (error) {
      const isValidationError =
        typeof error === 'object' &&
        error !== null &&
        'errorFields' in error &&
        Array.isArray((error as { errorFields?: unknown }).errorFields);
      if (!isValidationError) {
        setSubmitError(formatError(error, t('forgot.codeSendError')).message);
      }
    }
  }

  async function handleSubmit(values: ForgotPasswordFormValues) {
    setSubmitError('');

    try {
      const password = await sha256Hex(values.password);
      const { data } = await resetPassword({
        variables: {
          model: {
            username: values.username.trim(),
            code: values.code,
            password,
          },
        },
      });

      if (!data?.result?.success) {
        setSubmitError(data?.result?.message || t('forgot.error'));
        return;
      }

      message.success({
        content: t('forgot.success'),
        duration: 1,
        onClose: () => navigate({ pathname: LOGIN_ROUTE, search: location.search }, { replace: true }),
      });
    } catch (error) {
      setSubmitError(formatError(error, t('forgot.error')).message);
    }
  }

  return (
    <AuthShell title={t('forgot.title')} subtitle={t('forgot.subtitle')}>
      <Form<ForgotPasswordFormValues>
        className="auth-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="username"
          label={t('forgot.account')}
          rules={[{ required: true, message: t('forgot.accountPlaceholder') }]}
        >
          <Input autoComplete="username" placeholder={t('forgot.accountPlaceholder')} size="large" />
        </Form.Item>
        <Form.Item
          name="code"
          label={t('forgot.code')}
          rules={[{ required: true, message: t('forgot.codePlaceholder') }]}
        >
          <Input
            autoComplete="one-time-code"
            placeholder={t('forgot.codePlaceholder')}
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
                {cooldown > 0 ? t('forgot.cooldown', { seconds: cooldown }) : t('forgot.sendCode')}
              </Button>
            }
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('forgot.newPassword')}
          validateFirst
          rules={[
            { required: true, message: t('forgot.newPasswordPlaceholder') },
            { min: 6, message: t('forgot.passwordMin', { min: 6 }) },
            { pattern: PASSWORD_PATTERN, message: t('forgot.passwordComplexity') },
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder={t('forgot.newPasswordPlaceholder')} size="large" />
        </Form.Item>
        <PasswordStrengthIndicator
          password={watchedPassword}
          labels={{
            weak: t('forgot.passwordStrengthWeak'),
            medium: t('forgot.passwordStrengthMedium'),
            strong: t('forgot.passwordStrengthStrong'),
          }}
        />
        <Form.Item
          name="confirmPassword"
          label={t('forgot.confirmPassword')}
          dependencies={['password']}
          validateFirst
          rules={[
            { required: true, message: t('forgot.confirmPasswordPlaceholder') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('forgot.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={t('forgot.confirmPasswordPlaceholder')}
            size="large"
          />
        </Form.Item>
        {submitError ? <Alert message={submitError} type="error" showIcon /> : null}
        <div className="auth-button-stack">
          <Button
            block
            color="default"
            variant="solid"
            htmlType="submit"
            loading={resetting}
            shape="round"
            size="large"
          >
            {t('forgot.submit')}
          </Button>
          <Button
            block
            type="link"
            htmlType="button"
            shape="round"
            size="large"
            className="auth-secondary-button"
            onClick={() => redirectTo(resolveReturnTarget(location.search, 'forgot-cancel'))}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </Form>
    </AuthShell>
  );
}
