import { Alert, Button, Form, Input } from 'antd';
import { useMutation } from '@apollo/client';
import sha256 from 'crypto-js/sha256';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import LiquidGlass from '@/components/common/LiquidGlass';
import { setManagementToken, clearManagementToken } from '@/services/auth/token';
import { useI18n } from '@/services/i18n/i18n';
import { SIGNIN } from '@/apis/operations';
import styles from './index.module.less';

type LoginValues = {
  username: string;
  password: string;
};

function sha256Hex(value: string): string {
  return sha256(value).toString();
}

export function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const { t } = useI18n();
  const [login, { loading }] = useMutation(SIGNIN);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/clients';

  async function submit(values: LoginValues) {
    setError('');

    try {
      const result = await login({ variables: { input: { ...values, password: sha256Hex(values.password) } } });
      const token = result.data?.signin?.accessToken;
      if (!token) throw new Error('empty token');

      setManagementToken(token);
      onLogin(token);
      navigate(from === '/login' ? '/clients' : from, { replace: true });
    } catch {
      clearManagementToken();
      setError(t('login.error'));
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles['gradient-field']} aria-hidden="true" />
      <div className={styles.topActions}>
        <div className={styles.actionSlot}>
          <LiquidGlass
            className={styles.actionGlass}
            padding="0"
            overLight={false}
            cornerRadius={999}
            displacementScale={42}
            blurAmount={0.12}
            saturation={130}
            aberrationIntensity={2}
            elasticity={0.12}
            layout="inline"
          >
            <LanguageToggle buttonClassName={styles.actionButton} />
          </LiquidGlass>
        </div>
        <div className={styles.actionSlot}>
          <LiquidGlass
            className={styles.actionGlass}
            padding="0"
            overLight={false}
            cornerRadius={999}
            displacementScale={42}
            blurAmount={0.12}
            saturation={130}
            aberrationIntensity={2}
            elasticity={0.12}
            layout="inline"
          >
            <ThemeToggle buttonClassName={styles.actionButton} shape="circle" type="text" />
          </LiquidGlass>
        </div>
      </div>
      <LiquidGlass
        className={styles.panel}
        padding="0"
        overLight={false}
        cornerRadius={18}
        displacementScale={72}
        blurAmount={0.5}
        saturation={140}
        aberrationIntensity={2}
        elasticity={0}
        glassSize={{ width: 'min(500px, calc(100vw - 48px))' }}
        style={{ position: 'fixed', top: '50%', left: '50%' }}
      >
        <div className={styles.panelContent}>
          <Form<LoginValues> className={styles.form} layout="vertical" requiredMark={false} onFinish={submit}>
            <div className={styles.brand}>
              <span className={styles.brandMark}>ID</span>
              <span>{t('login.brand')}</span>
            </div>
            <h1 className={styles.title}>{t('login.title')}</h1>
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
              <Input.Password
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                size="large"
              />
            </Form.Item>
            {error ? <Alert message={error} type="error" showIcon /> : null}
            <Button
              block
              type="primary"
              htmlType="submit"
              loading={loading}
              shape="round"
              size="large"
              className="mt-3"
            >
              {t('login.submit')}
            </Button>
          </Form>
        </div>
      </LiquidGlass>
    </main>
  );
}
