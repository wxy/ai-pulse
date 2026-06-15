import React, { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppLayout from '@/components/options/AppLayout';
import { loadLanguage, getLanguage } from '@/utils/i18n';

const App: React.FC = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    loadLanguage().then(() => setLang(getLanguage()));
    chrome.storage.local.get('settings').then(result => {
      const theme = result.settings?.theme ?? 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    });
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.settings?.newValue?.theme) {
        document.documentElement.setAttribute('data-theme', changes.settings.newValue.theme);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  return (
    <ErrorBoundary key={lang}>
      <AppLayout />
    </ErrorBoundary>
  );
};

export default App;
