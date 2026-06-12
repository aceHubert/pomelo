import { Button, Result } from 'antd';
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { APP_TITLE, HOME_URL } from '@/services/app/env';
import { useI18n } from '@/services/i18n/i18n';
import { LOGIN_ROUTE, redirectTo } from '@/services/navigation/routes';
import styles from './index.module.less';
import type { MissingReturnUrlScene } from '@/services/navigation/routes';

function isMissingReturnUrlScene(value: string | null): value is MissingReturnUrlScene {
  return value === 'login-success' || value === 'modify-cancel' || value === 'forgot-cancel';
}

export function ResultPage() {
  const { t } = useI18n();
  const location = useLocation();

  useEffect(() => {
    document.title = `${t('result.title')} | ${APP_TITLE}`;
  }, [t]);

  const scene = useMemo<MissingReturnUrlScene>(() => {
    const value = new URLSearchParams(location.search).get('scene');
    return isMissingReturnUrlScene(value) ? value : 'login-success';
  }, [location.search]);

  const status = scene === 'login-success' ? 'success' : 'info';
  const titleKey =
    scene === 'modify-cancel'
      ? 'result.modifyCancelTitle'
      : scene === 'forgot-cancel'
      ? 'result.forgotCancelTitle'
      : 'result.loginSuccessTitle';
  const descriptionKey =
    scene === 'modify-cancel'
      ? 'result.modifyCancelDescription'
      : scene === 'forgot-cancel'
      ? 'result.forgotCancelDescription'
      : 'result.loginSuccessDescription';

  return (
    <AuthShell title={t('result.title')} subtitle={t('result.subtitle')}>
      <div className={styles.container}>
        <Result status={status} title={t(titleKey)} subTitle={t(descriptionKey)} />
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('result.stepsTitle')}</h2>
          <ol className={styles.steps}>
            <li>{t('result.step1')}</li>
            <li>{t('result.step2')}</li>
            <li>{t('result.step3')}</li>
            <li>{t('result.step4')}</li>
          </ol>
          <div className={styles.actions}>
            <Button
              block
              color="default"
              variant="solid"
              shape="round"
              size="large"
              onClick={() => redirectTo(LOGIN_ROUTE)}
            >
              {t('common.backToLogin')}
            </Button>
            <Button block type="link" shape="round" size="large" onClick={() => redirectTo(HOME_URL)}>
              {t('common.openHome')}
            </Button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
