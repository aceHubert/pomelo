import { Alert, Button, Descriptions, Result } from 'antd';
import { useMemo } from 'react';
import { useI18n } from '@/services/i18n/i18n';
import styles from './index.module.less';

type InitializeResultPageProps = {
  adminUrl: string;
  homeUrl: string;
  localeLabel?: string;
  email?: string;
  variant: 'success' | 'initialized';
};

function openTarget(url: string) {
  window.location.assign(url);
}

export function InitializeResultPage({ adminUrl, homeUrl, localeLabel, email, variant }: InitializeResultPageProps) {
  const { t } = useI18n();

  const steps = useMemo(
    () =>
      variant === 'success'
        ? [
            t('initialize.result.successStep1'),
            t('initialize.result.successStep2'),
            t('initialize.result.successStep3'),
          ]
        : [
            t('initialize.result.initializedStep1'),
            t('initialize.result.initializedStep2'),
            t('initialize.result.initializedStep3'),
          ],
    [t, variant],
  );

  const items = [
    {
      key: 'adminUrl',
      label: t('initialize.result.adminUrl'),
      children: adminUrl,
    },
    {
      key: 'homeUrl',
      label: t('initialize.result.homeUrl'),
      children: homeUrl.replace(window.location.origin, '') || '/',
    },
  ];

  if (email) {
    items.push({
      key: 'email',
      label: t('initialize.result.email'),
      children: email,
    });
  }

  if (localeLabel) {
    items.push({
      key: 'locale',
      label: t('initialize.result.locale'),
      children: localeLabel,
    });
  }

  return (
    <Result
      className={styles.result}
      status={variant === 'success' ? 'success' : 'info'}
      title={variant === 'success' ? t('initialize.result.successTitle') : t('initialize.result.initializedTitle')}
      subTitle={
        variant === 'success' ? t('initialize.result.successSubtitle') : t('initialize.result.initializedSubtitle')
      }
      extra={[
        <Button
          key="admin"
          color="default"
          variant="solid"
          shape="round"
          size="large"
          onClick={() => openTarget(adminUrl)}
        >
          {t('initialize.result.goAdmin')}
        </Button>,
        <Button key="home" shape="round" size="large" onClick={() => openTarget(homeUrl)}>
          {t('initialize.result.goHome')}
        </Button>,
      ]}
    >
      <div className={styles.guide}>
        <Alert
          className={styles.alert}
          type="info"
          showIcon
          message={t('initialize.result.guideTitle')}
          description={t('initialize.result.guideDescription')}
        />
        <Descriptions className={styles.descriptions} column={1} size="small" items={items} />
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </Result>
  );
}
