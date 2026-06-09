import { App as AntdApp, Button, Form, Input } from 'antd';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthShell } from '../../components/auth/AuthShell';
import { APP_TITLE } from '../../services/app/env';
import { useI18n } from '../../services/i18n/i18n';
import { redirectTo, resolveReturnTarget } from '../../services/navigation/routes';
import formStyles from '../../styles/form.module.less';

type ForgotPasswordFormValues = {
  username: string;
};

export function ForgotPasswordPage() {
  const { t } = useI18n();
  const location = useLocation();
  const { message } = AntdApp.useApp();

  useEffect(() => {
    document.title = `${t('forgot.title')} | ${APP_TITLE}`;
  }, [t]);

  function handleSubmit(_: ForgotPasswordFormValues) {
    // 保持旧行为：当前页面只提示 TODO，不新增后端契约。
    message.warning(t('forgot.todo'));
  }

  return (
    <AuthShell title={t('forgot.title')} subtitle={t('forgot.subtitle')}>
      <Form<ForgotPasswordFormValues>
        className={formStyles.form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="username"
          label={t('forgot.username')}
          rules={[{ required: true, message: t('forgot.usernamePlaceholder') }]}
        >
          <Input autoComplete="username" placeholder={t('forgot.usernamePlaceholder')} size="large" />
        </Form.Item>
        <div className={formStyles.buttonStack}>
          <Button block type="primary" htmlType="submit" shape="round" size="large">
            {t('forgot.submit')}
          </Button>
          <Button
            block
            type="link"
            htmlType="button"
            shape="round"
            size="large"
            className={formStyles.secondaryButton}
            onClick={() => redirectTo(resolveReturnTarget(location.search, 'forgot-cancel'))}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </Form>
    </AuthShell>
  );
}
