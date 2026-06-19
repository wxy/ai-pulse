import React, { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppLayout from '@/components/popup/AppLayout';
import { useProviders } from '@/hooks/useProviders';
import { loadLanguage, getLanguage } from '@/utils/i18n';

const App: React.FC = () => {
  const { providers, loading, error, refreshAll, refreshList } = useProviders();
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    loadLanguage().then(() => setLang(getLanguage()));
  }, []);

  return (
    <ErrorBoundary key={lang}>
      <AppLayout providers={providers} loading={loading} error={error} onRefresh={refreshAll} onSync={refreshList} />
    </ErrorBoundary>
  );
};

export default App;
