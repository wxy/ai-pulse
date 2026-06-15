import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { loadLanguage } from '@/utils/i18n';
import { initCustomProviders } from '@/core/provider-registry';

async function main() {
  try {
    await loadLanguage();
    await initCustomProviders();
  } catch (err) {
    console.error('Popup init failed:', err);
  }
  ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
}
main();
