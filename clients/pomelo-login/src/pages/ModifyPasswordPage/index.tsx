import { Alert, App as AntdApp, Button, Form, Input } from 'antd';
import { useMutation } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UPDATE_USER_PASSWORD,
  type UpdateUserPasswordMutationData,
  type UpdateUserPasswordMutationVariables,
} from '@/apis/operations';
import { AuthShell } from '@/components/auth/AuthShell';
import { APP_TITLE } from '@/services/app/env';
import { sha256Hex } from '@/services/auth/hash';
import { getStoredLoginName } from '@/services/auth/jwt';
import { clearStoredAuthToken } from '@/services/auth/token';
import { formatError } from '@/services/graphql/errors';
import { useI18n } from '@/services/i18n/i18n';
import { LOGIN_ROUTE, redirectTo, resolveReturnTarget } from '@/services/navigation/routes';

type ModifyPasswordFormValues = {
  username: string;
  oldPwd: string;
  newPwd: string;
};

export function ModifyPasswordPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [submitError, setSubmitError] = useState('');
  const initialUsername = getStoredLoginName();
  const [updateUserPassword, { loading }] = useMutation<
    UpdateUserPasswordMutationData,
    UpdateUserPasswordMutationVariables
  >(UPDATE_USER_PASSWORD);

  useEffect(() => {
    document.title = `${t('modify.title')} | ${APP_TITLE}`;
  }, [t]);

  async function handleSubmit(values: ModifyPasswordFormValues) {
    setSubmitError('');

    try {
      const [oldPwd, newPwd] = await Promise.all([sha256Hex(values.oldPwd), sha256Hex(values.newPwd)]);

      await updateUserPassword({
        variables: {
          model: {
            username: values.username,
            oldPwd,
            newPwd,
          },
        },
      });

      clearStoredAuthToken();
      message.success({
        content: t('modify.success'),
        duration: 1,
        onClose: () => navigate({ pathname: LOGIN_ROUTE, search: location.search }, { replace: true }),
      });
    } catch (error) {
      setSubmitError(formatError(error, t('modify.submit')).message);
    }
  }

  return (
    <AuthShell title={t('modify.title')} subtitle={t('modify.subtitle')}>
      <Form<ModifyPasswordFormValues>
        className="auth-form"
        layout="vertical"
        requiredMark={false}
        initialValues={{ username: initialUsername }}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="username"
          label={t('modify.username')}
          rules={[{ required: true, message: t('modify.usernamePlaceholder') }]}
        >
          <Input
            autoComplete="username"
            placeholder={t('modify.usernamePlaceholder')}
            readOnly={Boolean(initialUsername)}
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="oldPwd"
          label={t('modify.oldPassword')}
          rules={[{ required: true, message: t('modify.oldPasswordPlaceholder') }]}
        >
          <Input.Password
            autoComplete="current-password"
            placeholder={t('modify.oldPasswordPlaceholder')}
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="newPwd"
          label={t('modify.newPassword')}
          rules={[
            { required: true, message: t('modify.newPasswordPlaceholder') },
            { min: 6, message: t('modify.newPasswordMin', { min: 6 }) },
          ]}
        >
          <Input.Password autoComplete="new-password" placeholder={t('modify.newPasswordPlaceholder')} size="large" />
        </Form.Item>
        {submitError ? <Alert message={submitError} type="error" showIcon /> : null}
        <div className="auth-button-stack">
          <Button block type="primary" htmlType="submit" loading={loading} shape="round" size="large">
            {t('modify.submit')}
          </Button>
          <Button
            block
            type="link"
            htmlType="button"
            shape="round"
            size="large"
            className="auth-secondary-button"
            onClick={() => redirectTo(resolveReturnTarget(location.search, 'modify-cancel'))}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </Form>
    </AuthShell>
  );
}
