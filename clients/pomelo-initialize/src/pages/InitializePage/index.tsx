import { App as AntdApp, Button, Form, Input, Result, Select, Spin } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import LiquidGlass from '@/components/common/LiquidGlass';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import {
  CHECK_SITE_INITIAL_REQUIRED,
  START_SITE_INITIAL,
  type CheckSiteInitialRequiredData,
  type SiteInitArgsInput,
  type StartSiteInitialData,
  type StartSiteInitialVariables,
} from '@/apis/operations';
import { useI18n } from '@/services/i18n/i18n';
import { formatError } from '@/services/graphql/errors';
import { sha256Hex } from '@/utils/hash';
import { InitializeResultPage } from '@/pages/InitializeResultPage';
import styles from './index.module.less';

type InitializeFormValues = SiteInitArgsInput;
type ResultState = null | {
  adminUrl: string;
  email?: string;
  localeLabel?: string;
  variant: 'success' | 'initialized';
};

const PASSWORD_PATTERN = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\\!@#$%&*]{6,}$/;

function getReturnTarget() {
  const query = new URLSearchParams(window.location.search);
  const returnUrl = query.get('returnUrl');
  const redirect = query.get('redirect');
  const target = returnUrl || redirect;
  return target && target.trim() ? target : undefined;
}

function redirectToTarget(target: string) {
  window.location.replace(target);
}

export function InitializePage() {
  const { message } = AntdApp.useApp();
  const { t } = useI18n();
  const [form] = Form.useForm<InitializeFormValues>();
  const [resultState, setResultState] = useState<ResultState>(null);
  const [startSiteInitial, { loading: submitting }] = useMutation<StartSiteInitialData, StartSiteInitialVariables>(
    START_SITE_INITIAL,
  );
  const returnTarget = useMemo(() => getReturnTarget(), []);
  const defaultAdminUrl = useMemo(() => new URL('/admin', window.location.origin).toString(), []);
  const defaultHomeUrl = useMemo(() => new URL('/', window.location.origin).toString(), []);
  const { loading: checking, error: checkError } = useQuery<CheckSiteInitialRequiredData>(CHECK_SITE_INITIAL_REQUIRED, {
    fetchPolicy: 'network-only',
    onCompleted: (payload) => {
      if (!payload.result) {
        if (returnTarget) {
          redirectToTarget(returnTarget);
          return;
        }

        setResultState({
          adminUrl: defaultAdminUrl,
          variant: 'initialized',
        });
      }
    },
  });

  async function handleSubmit(values: InitializeFormValues) {
    try {
      const password = await sha256Hex(values.password);
      const result = await startSiteInitial({
        variables: {
          model: {
            ...values,
            password,
          },
        },
      });

      if (!result.data?.result) {
        throw new Error(t('initialize.startError'));
      }

      if (!returnTarget) {
        setResultState({
          adminUrl: defaultAdminUrl,
          email: values.email,
          localeLabel:
            values.locale === 'zh-CN' ? t('initialize.fields.locale.zh-CN') : t('initialize.fields.locale.en-US'),
          variant: 'success',
        });
        return;
      }

      message.success({
        content: t('initialize.success'),
        duration: 1.6,
        onClose: () => redirectToTarget(returnTarget),
      });
    } catch (error) {
      message.error(formatError(error, t('initialize.startError')).message);
    }
  }

  return (
    <main className={`${styles.shell} min-h-screen`}>
      <div className={styles['gradient-field']} aria-hidden="true" />
      <div className={styles.topActions}>
        <LiquidGlass className={styles.actionGlass} cornerRadius={999} padding="0 6px">
          <LanguageToggle className={styles.actionButton} />
        </LiquidGlass>
      </div>
      <LiquidGlass className={styles.panel} padding="0" cornerRadius={22}>
        <div className={styles.panelContent}>
          {checkError ? (
            <Result
              className={styles.result}
              status="error"
              title={t('initialize.checkError')}
              subTitle={formatError(checkError, t('initialize.checkError')).message}
              extra={
                <Button
                  color="default"
                  variant="solid"
                  shape="round"
                  size="large"
                  onClick={() => window.location.reload()}
                >
                  {t('common.refresh')}
                </Button>
              }
            />
          ) : resultState ? (
            <InitializeResultPage
              adminUrl={resultState.adminUrl}
              email={resultState.email}
              homeUrl={defaultHomeUrl}
              localeLabel={resultState.localeLabel}
              variant={resultState.variant}
            />
          ) : (
            <Spin spinning={checking} size="large" tip={t('common.loading')}>
              <div className={styles.brand}>
                <span className={styles.brandMark}>PM</span>
                <span>{t('initialize.brand')}</span>
              </div>
              <h1 className={styles.title}>{t('initialize.title')}</h1>
              <p className={styles.description}>{t('initialize.description')}</p>
              <Form<InitializeFormValues>
                form={form}
                className={styles.form}
                layout="vertical"
                requiredMark={false}
                initialValues={{
                  title: 'Pomelo',
                  homeUrl: window.location.origin,
                  locale: 'en-US',
                }}
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="title"
                  label={t('initialize.fields.title.label')}
                  rules={[{ required: true, message: t('initialize.fields.title.required') }]}
                >
                  <Input placeholder={t('initialize.fields.title.placeholder')} size="large" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label={t('initialize.fields.password.label')}
                  rules={[
                    { required: true, message: t('initialize.fields.password.required') },
                    {
                      pattern: PASSWORD_PATTERN,
                      message: t('initialize.fields.password.invalid'),
                    },
                  ]}
                >
                  <Input.Password placeholder={t('initialize.fields.password.placeholder')} size="large" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label={t('initialize.fields.email.label')}
                  rules={[
                    { required: true, message: t('initialize.fields.email.required') },
                    { type: 'email', message: t('initialize.fields.email.invalid') },
                  ]}
                >
                  <Input placeholder={t('initialize.fields.email.placeholder')} size="large" />
                </Form.Item>
                <Form.Item
                  name="homeUrl"
                  label={t('initialize.fields.homeUrl.label')}
                  rules={[
                    { required: true, message: t('initialize.fields.homeUrl.required') },
                    { type: 'url', message: t('initialize.fields.homeUrl.invalid') },
                  ]}
                >
                  <Input placeholder={t('initialize.fields.homeUrl.placeholder')} size="large" />
                </Form.Item>
                <Form.Item
                  name="locale"
                  label={t('initialize.fields.locale.label')}
                  rules={[{ required: true, message: t('initialize.fields.locale.required') }]}
                >
                  <Select
                    size="large"
                    placeholder={t('initialize.fields.locale.placeholder')}
                    options={[
                      { value: 'en-US', label: t('initialize.fields.locale.en-US') },
                      { value: 'zh-CN', label: t('initialize.fields.locale.zh-CN') },
                    ]}
                  />
                </Form.Item>
                <Button
                  block
                  color="default"
                  variant="solid"
                  htmlType="submit"
                  loading={submitting}
                  shape="round"
                  size="large"
                  className="mt-3"
                >
                  {t('initialize.submit')}
                </Button>
              </Form>
            </Spin>
          )}
        </div>
      </LiquidGlass>
    </main>
  );
}
