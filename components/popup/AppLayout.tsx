import React, { useState } from 'react';
import type { ProviderSummary } from '@/types';
import ProviderCard from './ProviderCard';
import PopupSettings from './PopupSettings';
import { t } from '@/utils/i18n';

interface AppLayoutProps { providers: ProviderSummary[]; loading: boolean; error: string | null; onRefresh: () => void; }

const AppLayout: React.FC<AppLayoutProps> = ({ providers, loading, error, onRefresh }) => {
  const [tab, setTab] = useState<'monitor' | 'settings'>('monitor');
  const enabledProviders = providers.filter(p => p.config?.enabled !== false);
  const withKey = providers.filter(p => p.config?.apiKey).length;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left"><h1>🤖 AI Pulse</h1></div>
        <div className="header-right">
          <button className="icon-button" onClick={onRefresh} disabled={loading} title={t('popup.refresh')}>🔄</button>
        </div>
      </header>

      <nav className="tab-bar">
        <button className={`tab-item ${tab === 'monitor' ? 'tab-active' : ''}`} onClick={() => setTab('monitor')}>
          📡 {t('nav.providers')}
        </button>
        <button className={`tab-item ${tab === 'settings' ? 'tab-active' : ''}`} onClick={() => setTab('settings')}>
          ⚙️ {t('nav.settings')}
        </button>
      </nav>

      {error && <div className="error-banner"><span>⚠️ {error}</span></div>}

      {tab === 'monitor' && (
        <main className="provider-list">
          {loading && providers.length === 0 ? (
            <div className="loading-state"><div className="skeleton-card" /><div className="skeleton-card" /></div>
          ) : providers.length === 0 ? (
            <div className="empty-state">{t('popup.empty')}</div>
          ) : (
            providers.map(summary => <ProviderCard key={summary.provider.id} summary={summary} />)
          )}
        </main>
      )}

      {tab === 'settings' && (
        <main className="settings-panel">
          <PopupSettings providers={providers} />
        </main>
      )}

      <footer className="app-footer">
        <span className="footer-summary">
          {enabledProviders.length} {t('nav.providers')} · {withKey} 🔑
        </span>
      </footer>
    </div>
  );
};

export default AppLayout;
