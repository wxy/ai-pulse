import React, { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppLayout from '@/components/options/AppLayout';
import { initCustomProviders } from '@/core/provider-registry';
import { loadLanguage } from '@/utils/i18n';

const App: React.FC = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load language BEFORE first render to avoid flash of wrong language
    loadLanguage().then(() => {
      initCustomProviders().then(() => setReady(true));
    });

    // Apply theme
    chrome.storage.local.get('settings').then(result => {
      const theme = result.settings?.theme ?? 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.settings?.newValue?.theme) {
        document.documentElement.setAttribute('data-theme', changes.settings.newValue.theme);
      }
      if (changes.custom_providers) {
        initCustomProviders();
      }
      if (changes.language) {
        loadLanguage().then(() => setReady(true));
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  );
};

export default App;
