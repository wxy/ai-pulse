import React, { useState, useEffect } from 'react';
import ProviderList from './ProviderList';
import ProviderConfig from './ProviderConfig';
import SettingsPanel from './SettingsPanel';
import { getProvider } from '@/core/provider-registry';
import { t } from '@/utils/i18n';
import type { Provider } from '@/types';

type Route = 'providers' | 'settings' | 'about';

const AppLayout: React.FC = () => {
  const [route, setRoute] = useState<Route>('providers');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  useEffect(() => {
    chrome.storage.local.get('navigate_to_provider').then(result => {
      const id = result.navigate_to_provider as string | undefined;
      if (id) {
        const p = getProvider(id);
        if (p) { setRoute('providers'); setSelectedProvider(p); }
        chrome.storage.local.remove('navigate_to_provider');
      }
    });
  }, []);

  return (
    <div className="options-app-layout">
      <nav className="options-topnav">
        <div className="topnav-tabs">
          <button className={`topnav-tab ${route === 'providers' ? 'tab-active' : ''}`} onClick={() => { setRoute('providers'); setSelectedProvider(null); }}>
            {t('nav.providers')}
          </button>
          <button className={`topnav-tab ${route === 'settings' ? 'tab-active' : ''}`} onClick={() => { setRoute('settings'); setSelectedProvider(null); }}>
            {t('nav.settings')}
          </button>
          <button className={`topnav-tab ${route === 'about' ? 'tab-active' : ''}`} onClick={() => setRoute('about')}>
            {t('nav.about')}
          </button>
        </div>
      </nav>
      <main className="options-content">
        {route === 'providers' && !selectedProvider && <ProviderList onSelect={setSelectedProvider} />}
        {route === 'providers' && selectedProvider && <ProviderConfig provider={selectedProvider} onBack={() => setSelectedProvider(null)} />}
        {route === 'settings' && <SettingsPanel />}
        {route === 'about' && (
          <div className="about-page">
            <h2>{t('about.title')}</h2>
            <p>{t('about.desc')}</p>
            <p className="version">{t('about.version')} 0.1.0</p>
            <div className="about-links"><p>{t('about.supported')}</p></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AppLayout;
