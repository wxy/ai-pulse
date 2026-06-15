import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { loadLanguage } from '@/utils/i18n';
import { initCustomProviders } from '@/core/provider-registry';

async function main() {
  await loadLanguage();
  await initCustomProviders();
  ReactDOM.createRoot(document.getElementById('app')!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
}
main();
