import React, { useState } from 'react';
import type { Provider } from '@/types';
import { useProviderConfigs } from '@/hooks/useProviderStatus';
import { getCustomProviders, removeCustomProvider } from '@/core/provider-registry';
import ProviderIcon from '@/components/shared/ProviderIcon';
import CustomProviderForm from './CustomProviderForm';
import { t } from '@/utils/i18n';

interface ProviderListProps {
  onSelect: (provider: Provider) => void;
}

const ProviderList: React.FC<ProviderListProps> = ({ onSelect }) => {
  const { configs, loading, providers, saveConfig, reload } = useProviderConfigs();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customProviders, setCustomProviders] = useState<Provider[]>(getCustomProviders());

  if (loading) {
    return (
      <div className="provider-list-page">
        <h2>{t('providers.title')}</h2>
        <div className="skeleton-list">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-row" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="provider-list-page">
      <h2>{t('providers.title')}</h2>
      <p className="section-desc">{t('providers.desc')}</p>

      <div className="provider-config-list">
        {providers.map(provider => {
          const config = configs.find(c => c.providerId === provider.id);
          const isEnabled = config?.enabled !== false;
          const hasKey = Boolean(config?.apiKey);

          return (
            <div key={provider.id} className={`provider-config-row ${isEnabled ? '' : 'provider-row-disabled'}`}>
              <div className="provider-row-main">
                <div className="provider-row-info">
                  <ProviderIcon provider={provider} size={32} />
                  <div>
                    <h3>{config?.displayName || provider.name}</h3>
                    <p className="row-desc">{provider.company}</p>
                  </div>
                </div>
                <div className="provider-row-actions">
                  {provider.capabilities.canFetchBalance && (
                    <span className={`key-status ${hasKey ? 'key-configured' : 'key-missing'}`}>
                      {hasKey ? t('providers.configured') : t('providers.not_configured')}
                    </span>
                  )}
                  <label className="toggle">
                    <input type="checkbox" checked={isEnabled} onChange={() => {
                      saveConfig({ providerId: provider.id, enabled: !isEnabled, apiKey: config?.apiKey ?? '', displayName: config?.displayName ?? '', alertEnabled: config?.alertEnabled !== false });
                    }} />
                    <span className="toggle-slider" />
                  </label>
                  <button className="btn btn-small" onClick={() => onSelect(provider)}>
                    {t('providers.configure')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {customProviders.map(provider => (
          <div key={provider.id} className="provider-config-row">
            <div className="provider-row-main">
              <div className="provider-row-info">
                <ProviderIcon provider={provider} size={32} />
                <div>
                  <h3>{provider.name}</h3>
                  <p className="row-desc">{provider.company} · {t('custom.custom_label')}</p>
                </div>
              </div>
              <div className="provider-row-actions">
                <button className="btn btn-small" onClick={() => onSelect(provider)}>{t('providers.configure')}</button>
                <button className="btn btn-danger" onClick={() => { removeCustomProvider(provider.id); setCustomProviders(getCustomProviders()); reload(); }}>
                  {t('providers.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCustomForm ? (
        <CustomProviderForm onDone={() => { setShowCustomForm(false); setCustomProviders(getCustomProviders()); reload(); }} />
      ) : (
        <button className="btn btn-small" style={{ marginTop: 12 }} onClick={() => setShowCustomForm(true)}>
          {t('providers.add_custom')}
        </button>
      )}
    </div>
  );
};

export default ProviderList;
