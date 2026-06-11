import { Alert, Button, Result, Spin } from 'antd';
import { useMutation } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { COMPLETE_SOCIAL_AUTH, toGraphqlAuthProvider } from '@/apis/operations';
import { AuthShell } from '@/components/auth/AuthShell';
import { APP_TITLE } from '@/services/app/env';
import { setStoredAuthToken } from '@/services/auth/token';
import { formatError } from '@/services/graphql/errors';
import { useI18n } from '@/services/i18n/i18n';
import { LOGIN_ROUTE, redirectTo, resolveReturnTarget } from '@/services/navigation/routes';
import type {
  AuthProvider,
  SocialAuthCompleteMutationData,
  SocialAuthCompleteMutationVariables,
} from '@/apis/operations';

function normalizeAuthProvider(value: string | undefined): AuthProvider | '' {
  if (value === 'google' || value === 'github' || value === 'linuxdo') return value;
  return '';
}

export function OAuthCallbackPage() {
  const { t } = useI18n();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const consumedRef = useRef(false);
  const [error, setError] = useState('');
  const [completeSocialAuth] = useMutation<SocialAuthCompleteMutationData, SocialAuthCompleteMutationVariables>(
    COMPLETE_SOCIAL_AUTH,
  );

  useEffect(() => {
    document.title = `${t('oauth.title')} | ${APP_TITLE}`;
  }, [t]);

  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;

    const provider = normalizeAuthProvider(params.provider);
    const code = searchParams.get('code') || '';
    const state = searchParams.get('state') || '';

    if (!provider || !code || !state) {
      setError(t('oauth.invalidCallback'));
      return;
    }

    completeSocialAuth({
      variables: {
        model: {
          provider: toGraphqlAuthProvider(provider),
          code,
          state,
        },
      },
    })
      .then(({ data }) => {
        if (!data?.result?.success) {
          setError(data?.result?.message || t('oauth.error'));
          return;
        }

        setStoredAuthToken(data.result.accessToken, data.result.tokenType);
        redirectTo(data.result.returnUrl || resolveReturnTarget('', 'login-success'));
      })
      .catch((caughtError) => {
        setError(formatError(caughtError, t('oauth.error')).message);
      });
  }, [completeSocialAuth, params.provider, searchParams, t]);

  if (error) {
    return (
      <AuthShell title={t('oauth.title')} subtitle={t('oauth.subtitle')}>
        <div className="auth-button-stack">
          <Alert message={error} type="error" showIcon />
          <Link to={LOGIN_ROUTE}>
            <Button block type="primary" shape="round" size="large">
              {t('common.backToLogin')}
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Result
        icon={<Spin />}
        title={t('oauth.processingTitle')}
        subTitle={t('oauth.processingDescription')}
        className="auth-result-compact"
      />
    </AuthShell>
  );
}
