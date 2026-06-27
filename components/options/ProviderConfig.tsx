import React from 'react';
import type { Provider } from '@/types';
import { useProviderConfigs } from '@/hooks/useProviderStatus';
import ProviderIcon from '@/components/shared/ProviderIcon';
import ApiKeyManager from './ApiKeyManager';
import BalanceHistoryChart from './BalanceHistoryChart';
import { t } from '@/utils/i18n';

interface ProviderConfigProps { provider: Provider; onBack: () => void; }

const ProviderConfig: React.FC<ProviderConfigProps> = ({ provider, onBack }) => {
  const { configs, saveConfig } = useProviderConfigs();
  const config = configs.find(c => c.providerId === provider.id);

  return (
    <div className="provider-config-page">
      <button className="back-button" onClick={onBack}>{t('config.back')}</button>
      <div className="provider-config-header">
        <ProviderIcon provider={provider} size={48} />
        <div><h2>{provider.name}</h2><p>{provider.company} · {provider.description}</p></div>
      </div>

      <section className="config-section">
        <h3>{t('config.display_name')}</h3>
        <input className="text-input" value={config?.displayName ?? ''} placeholder={provider.name}
          onChange={e => saveConfig({ providerId: provider.id, enabled: config?.enabled !== false, apiKey: config?.apiKey ?? '', displayName: e.target.value, alertEnabled: config?.alertEnabled !== false })} />
      </section>

      {provider.capabilities.canFetchBalance && (
        <section className="config-section">
          <h3>{t('config.api_key')}</h3>
          <p className="section-desc">{t('config.api_key_desc')}</p>
          <ApiKeyManager providerId={provider.id} currentKey={config?.apiKey ?? ''} provider={provider}
            onSave={async (key) => { await saveConfig({ providerId: provider.id, enabled: config?.enabled !== false, apiKey: key, displayName: config?.displayName ?? '', alertEnabled: config?.alertEnabled !== false }); window.location.reload(); }} />
        </section>
      )}

      {provider.capabilities.canFetchBalance && config?.apiKey && (
        <section className="config-section">
          <h3>{t('config.alert_title')}</h3>
          <p className="section-desc">{t('config.alert_desc')}</p>
          <div className="alert-toggle-row">
            <label className="toggle">
              <input type="checkbox" checked={config?.alertEnabled !== false}
                onChange={() => saveConfig({ providerId: provider.id, enabled: config?.enabled !== false, apiKey: config?.apiKey ?? '', displayName: config?.displayName ?? '', alertEnabled: !(config?.alertEnabled !== false) })} />
              <span className="toggle-slider" />
            </label>
            <span className="alert-toggle-label">{config?.alertEnabled !== false ? t('config.alert_on') : t('config.alert_off')}</span>
          </div>
        </section>
      )}

      {!provider.capabilities.canFetchBalance && (
        <section className="config-section">
          <h3>{t('config.status_only_title')}</h3>
          <p className="section-desc">{provider.noBalanceNote ? t(provider.noBalanceNote) : t('config.status_only_desc')}</p>
        </section>
      )}

      <section className="config-section">
        <h3>{t('config.links')}</h3>
        <div className="provider-links">
          <a href={provider.baseUrl} target="_blank" rel="noopener noreferrer" className="btn btn-small">{t('config.console')}</a>
          {provider.statusPageUrl && <a href={provider.statusPageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-small">{t('config.status_page')}</a>}
        </div>
      </section>

      {provider.capabilities.canFetchBalance && config?.apiKey && (
        <section className="config-section"><BalanceHistoryChart providerId={provider.id} /></section>
      )}
    </div>
  );
};

export default ProviderConfig;
