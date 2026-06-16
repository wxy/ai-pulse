import React, { useState } from 'react';
import type { ProviderSummary } from '@/types';
import ProviderCard from './ProviderCard';
import ProviderDetail from './ProviderDetail';
import PopupSettings from './PopupSettings';
import { t } from '@/utils/i18n';

type View = 'monitor' | 'settings' | { providerId: string };

interface AppLayoutProps { providers: ProviderSummary[]; loading: boolean; error: string | null; onRefresh: () => void; }

const AppLayout: React.FC<AppLayoutProps> = ({ providers, loading, error, onRefresh }) => {
  const [view, setView] = useState<View>('monitor');
  const enabledProviders = providers.filter(p => p.config?.enabled !== false);
  const withKey = providers.filter(p => p.config?.apiKey).length;

  // Provider detail view
  if (typeof view === 'object') {
    const summary = providers.find(p => p.provider.id === view.providerId);
    if (summary) {
      return (
        <div className="app-layout">
          <ProviderDetail summary={summary} onBack={() => setView('monitor')} />
        </div>
      );
    }
    setView('monitor');
    return null;
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left"><h1>🤖 AI Pulse</h1></div>
        <div className="header-right">
          <button className="icon-button" onClick={onRefresh} disabled={loading} title={t('popup.refresh')}>🔄</button>
        </div>
      </header>

      <nav className="tab-bar">
        <button className={`tab-item ${view === 'monitor' ? 'tab-active' : ''}`} onClick={() => setView('monitor')}>
          📡 {t('nav.providers')}
        </button>
        <button className={`tab-item ${view === 'settings' ? 'tab-active' : ''}`} onClick={() => setView('settings')}>
          ⚙️ {t('nav.settings')}
        </button>
      </nav>

      {error && <div className="error-banner"><span>⚠️ {error}</span></div>}

      {view === 'monitor' && (
        <main className="provider-list">
          {loading && enabledProviders.length === 0 ? (
            <div className="loading-state"><div className="skeleton-card" /><div className="skeleton-card" /></div>
          ) : enabledProviders.length === 0 ? (
            <div className="empty-state">{t('popup.empty')}</div>
          ) : (
            enabledProviders.map(summary => (
              <ProviderCard key={summary.provider.id} summary={summary} onSelect={() => setView({ providerId: summary.provider.id })} />
            ))
          )}
        </main>
      )}

      {view === 'settings' && (
        <main className="settings-panel">
          <PopupSettings providers={providers} onRefresh={onRefresh} />
        </main>
      )}

      <footer className="app-footer">
        <span className="footer-summary">
          {enabledProviders.length} providers · {withKey} 🔑
        </span>
      </footer>
    </div>
  );
};

export default AppLayout;
