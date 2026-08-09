import React, { useState } from 'react';
import ProviderList from './ProviderList';
import ProviderConfig from './ProviderConfig';
import SettingsPanel from './SettingsPanel';
import { t } from '@/utils/i18n';
import type { Provider } from '@/types';
import pkg from '../../package.json';

type Route = 'providers' | 'settings' | 'about';

const AppLayout: React.FC = () => {
  const [route, setRoute] = useState<Route>('providers');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

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
            <p className="version">{t('about.version')} {pkg.version}</p>
            <div className="about-links"><p>{t('about.supported')}</p></div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AppLayout;
