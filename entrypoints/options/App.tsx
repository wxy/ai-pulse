import React, { useEffect, useState } from 'react';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import AppLayout from '@/components/options/AppLayout';
import { loadLanguage, getLanguage } from '@/utils/i18n';

const App: React.FC = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    loadLanguage().then(() => setLang(getLanguage()));
  }, []);

  return (
    <ErrorBoundary key={lang}>
      <AppLayout />
    </ErrorBoundary>
  );
};

export default App;
