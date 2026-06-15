import React, { useEffect } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppLayout from '@/components/popup/AppLayout';
import { useProviders } from '@/hooks/useProviders';

const App: React.FC = () => {
  const { providers, loading, error, refreshAll } = useProviders();

  useEffect(() => {
    chrome.storage.local.get('settings').then(result => {
      const theme = result.settings?.theme ?? 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    });
  }, []);

  return (
    <ErrorBoundary>
      <AppLayout providers={providers} loading={loading} error={error} onRefresh={refreshAll} />
    </ErrorBoundary>
  );
};

export default App;
