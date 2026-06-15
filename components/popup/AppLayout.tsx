import React from 'react';
import type { ProviderSummary } from '@/types';
import ProviderCard from './ProviderCard';
import { t } from '@/utils/i18n';

interface AppLayoutProps { providers: ProviderSummary[]; loading: boolean; error: string | null; onRefresh: () => void; }

const AppLayout: React.FC<AppLayoutProps> = ({ providers, loading, error, onRefresh }) => {
  const enabledProviders = providers.filter(p => p.config?.enabled !== false);
  const withKey = providers.filter(p => p.config?.apiKey).length;
  const withAlert = providers.filter(p => {
    const bal = p.balanceCache?.result?.balances?.[0];
    return p.config?.alertEnabled !== false && bal && bal.totalBalance > 0;
  }).length;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left"><h1>🤖 AI Pulse</h1></div>
        <div className="header-right">
          <button className="icon-button" onClick={() => chrome.runtime.openOptionsPage()} title={t('popup.settings')}>⚙️</button>
          <button className="icon-button" onClick={onRefresh} disabled={loading} title={t('popup.refresh')}>🔄</button>
        </div>
      </header>

      {error && <div className="error-banner"><span>⚠️ {error}</span></div>}

      <main className="provider-list">
        {loading && providers.length === 0 ? (
          <div className="loading-state"><div className="skeleton-card" /><div className="skeleton-card" /></div>
        ) : providers.length === 0 ? (
          <div className="empty-state">{t('popup.empty')}</div>
        ) : (
          providers.map(summary => <ProviderCard key={summary.provider.id} summary={summary} />)
        )}
      </main>

      <footer className="app-footer">
        <span className="footer-summary">
          {enabledProviders.length} {t('nav.providers')} · {withKey} 🔑{withAlert > 0 ? ` · ⚠${withAlert}` : ''}
        </span>
      </footer>
    </div>
  );
};

export default AppLayout;
