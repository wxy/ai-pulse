import { useState, useEffect } from 'react';
import { loadLanguage, t, getLanguage } from '@/utils/i18n';

export function useI18n() {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    loadLanguage().then(() => setLang(getLanguage()));
  }, []);

  return { t, lang };
}
