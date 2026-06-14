import { useI18n } from '@/utils/i18n';
import React from 'react';
import type { ProviderSummary } from '@/types';
import ProviderCard from './ProviderCard';

interface AppLayoutProps {
  providers: ProviderSummary[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ providers, loading, error, onRefresh }) => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1>🤖 AI Pulse</h1>
        </div>
        <div className="header-right">
          <button
            className="refresh-button"
            onClick={onRefresh}
            disabled={loading}
            title="刷新全部服务商"
          >
            🔄
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      <main className="provider-list">
        {loading && providers.length === 0 ? (
          <div className="loading-state">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : providers.length === 0 ? (
          <div className="empty-state">未配置服务商，请进入设置页面添加。</div>
        ) : (
          providers.map(summary => (
            <ProviderCard key={summary.provider.id} summary={summary} />
          ))
        )}
      </main>

      <footer className="app-footer">
        <button
          className="settings-link"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          ⚙️ 设置
        </button>
      </footer>
    </div>
  );
};

export default AppLayout;
