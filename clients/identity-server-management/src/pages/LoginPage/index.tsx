import { Alert, Button, Form, Input } from 'antd';
import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import LiquidGlass from '../../components/common/LiquidGlass';
import { setManagementToken, clearManagementToken } from '../../services/auth/token';
import { applyThemePreference, getStoredThemePreference } from '../../services/theme/theme';
import { useI18n } from '../../services/i18n/i18n';
import { SIGNIN } from '../../apis/operations';
import styles from './index.module.less';

type LoginValues = {
  username: string;
  password: string;
};

function getNextThemePreference(theme: ReturnType<typeof getStoredThemePreference>) {
  if (theme === 'system') return 'dark';
  if (theme === 'dark') return 'light';
  return 'system';
}

function getThemeToggleMeta(theme: ReturnType<typeof getStoredThemePreference>, t: ReturnType<typeof useI18n>['t']) {
  if (theme === 'system') return { icon: <DesktopOutlined />, label: t('theme.systemToDark') };
  if (theme === 'dark') return { icon: <MoonOutlined />, label: t('theme.darkToLight') };
  return { icon: <SunOutlined />, label: t('theme.lightToSystem') };
}

export function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const { t } = useI18n();
  const [login, { loading }] = useMutation(SIGNIN);
  const [error, setError] = useState('');
  const [themePreference, setThemePreference] = useState(() => getStoredThemePreference());
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/clients';
  const themeToggleMeta = getThemeToggleMeta(themePreference, t);

  async function submit(values: LoginValues) {
    setError('');

    try {
      const result = await login({ variables: { input: values } });
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

  function toggleTheme() {
    const nextThemePreference = getNextThemePreference(themePreference);
    applyThemePreference(nextThemePreference);
    setThemePreference(nextThemePreference);
  }

  return (
    <main className={styles.shell}>
      <div className={styles.gradientField} aria-hidden="true" />
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
            <Button
              aria-label={themeToggleMeta.label}
              className={styles.actionButton}
              htmlType="button"
              icon={themeToggleMeta.icon}
              shape="circle"
              title={themeToggleMeta.label}
              type="text"
              onClick={toggleTheme}
            />
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
        elasticity={0.12}
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
