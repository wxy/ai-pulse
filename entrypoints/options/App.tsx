import React, { useEffect } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppLayout from '@/components/options/AppLayout';

const App: React.FC = () => {
  useEffect(() => {
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
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  );
};

export default App;
