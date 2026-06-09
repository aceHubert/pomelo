import { useEffect } from 'react';
import { InitializePage } from './pages/InitializePage';
import { useI18n } from './services/i18n/i18n';

export function App() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t('site.title');
  }, [t]);

  return <InitializePage />;
}
