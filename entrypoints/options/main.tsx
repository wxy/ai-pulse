import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { loadLanguage } from '@/utils/i18n';
import { initCustomProviders } from '@/core/provider-registry';

// Fire and forget — always render, even if init fails
loadLanguage().catch(console.error);
initCustomProviders().catch(console.error);

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
