import { useI18n } from '@/utils/i18n';
import React, { useState, useEffect } from 'react';
import ProviderList from './ProviderList';
import ProviderConfig from './ProviderConfig';
import SettingsPanel from './SettingsPanel';
import { getProvider } from '@/core/provider-registry';
import type { Provider } from '@/types';

type Route = 'providers' | 'settings' | 'about';

const AppLayout: React.FC = () => {
  const [route, setRoute] = useState<Route>('providers');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Handle navigation intent from popup
  useEffect(() => {
    chrome.storage.local.get('navigate_to_provider').then(result => {
      const providerId = result.navigate_to_provider as string | undefined;
      if (providerId) {
        const provider = getProvider(providerId);
        if (provider) {
          setRoute('providers');
          setSelectedProvider(provider);
        }
        // Clear the intent
        chrome.storage.local.remove('navigate_to_provider');
      }
    });
  }, []);

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
  };

  const handleBack = () => {
    setSelectedProvider(null);
  };

  return (
    <div className="options-app-layout">
      <nav className="options-topnav">
        <span className="topnav-brand">🤖 AI Pulse</span>
        <div className="topnav-tabs">
          <button
            className={`topnav-tab ${route === 'providers' ? 'tab-active' : ''}`}
            onClick={() => { setRoute('providers'); setSelectedProvider(null); }}
          >
            📡 服务商
          </button>
          <button
            className={`topnav-tab ${route === 'settings' ? 'tab-active' : ''}`}
            onClick={() => { setRoute('settings'); setSelectedProvider(null); }}
          >
            ⚙️ 设置
          </button>
          <button
            className={`topnav-tab ${route === 'about' ? 'tab-active' : ''}`}
            onClick={() => setRoute('about')}
          >
            ℹ️ 关于
          </button>
        </div>
      </nav>
      <main className="options-content">
        {route === 'providers' && !selectedProvider && (
          <ProviderList onSelect={handleSelectProvider} />
        )}
        {route === 'providers' && selectedProvider && (
          <ProviderConfig provider={selectedProvider} onBack={handleBack} />
        )}
        {route === 'settings' && <SettingsPanel />}
        {route === 'about' && (
          <div className="about-page">
            <h2>关于 AI Pulse</h2>
            <p>监控您的 AI 服务商用量、余额和服务状态。</p>
            <p className="version">版本 0.1.0</p>
            <div className="about-links">
              <p>已支持：DeepSeek · Moonshot (Kimi) · 智谱 (ChatGLM) · 百川智能 · 通义千问 (Qwen) · 文心一言 (ERNIE)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AppLayout;
