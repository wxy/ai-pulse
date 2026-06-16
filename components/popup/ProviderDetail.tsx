import React from 'react';
import type { ProviderSummary } from '@/types';
import ProviderIcon from '@/components/shared/ProviderIcon';
import ApiKeyManager from '@/components/options/ApiKeyManager';
import BalanceHistoryChart from '@/components/options/BalanceHistoryChart';
import { useProviderConfigs } from '@/hooks/useProviderStatus';
import { t } from '@/utils/i18n';

interface ProviderDetailProps { summary: ProviderSummary; onBack: () => void; onConfigChanged: () => void; }

const ProviderDetail: React.FC<ProviderDetailProps> = ({ summary, onBack, onConfigChanged }) => {
  const { provider, config, balanceCache } = summary;
  const { configs, saveConfig } = useProviderConfigs();
  const currentConfig = configs.find(c => c.providerId === provider.id) || config;

  const handleSaveKey = async (key: string) => {
    await saveConfig({
      providerId: provider.id, enabled: currentConfig?.enabled !== false,
      apiKey: key, displayName: currentConfig?.displayName ?? '',
      alertEnabled: currentConfig?.alertEnabled !== false,
    });
  };

  return (
    <div className="provider-detail">
      <header className="detail-header">
        <button className="back-button" onClick={onBack}>{t('config.back')}</button>
      </header>
      <main className="detail-body">
        <div className="provider-config-header">
          <ProviderIcon provider={provider} size={36} />
          <div>
            <h2>{currentConfig?.displayName || provider.name}</h2>
            <p className="detail-company">{provider.company} · {provider.description}</p>
          </div>
        </div>

        <section className="detail-section">
          <h3>{t('config.display_name')}</h3>
          <div className="detail-row">
            <input className="detail-input flex-1" value={currentConfig?.displayName ?? ''} placeholder={provider.name}
              onChange={e => saveConfig({
                providerId: provider.id, enabled: currentConfig?.enabled !== false,
                apiKey: currentConfig?.apiKey ?? '', displayName: e.target.value,
                alertEnabled: currentConfig?.alertEnabled !== false,
              })} />
            <button
              className={`btn-disable ${currentConfig?.enabled !== false ? 'is-disabled' : 'is-enabled'}`}
              onClick={async () => {
                await saveConfig({
                  providerId: provider.id, enabled: !(currentConfig?.enabled !== false),
                  apiKey: currentConfig?.apiKey ?? '', displayName: currentConfig?.displayName ?? '',
                  alertEnabled: currentConfig?.alertEnabled !== false,
                });
                onConfigChanged();
                onBack();
              }}>
              {currentConfig?.enabled !== false ? t('settings.disable') : t('settings.enable')}
            </button>
          </div>
        </section>

        {provider.capabilities.canFetchBalance && (
          <section className="detail-section">
            <h3>{t('config.api_key')}</h3>
            <p className="detail-desc">{t('config.api_key_desc')}</p>
            <ApiKeyManager providerId={provider.id} currentKey={currentConfig?.apiKey ?? ''} provider={provider} onSave={handleSaveKey} />
          </section>
        )}

        {provider.capabilities.canFetchBalance && currentConfig?.apiKey && (
          <section className="detail-section">
            <h3>{t('config.alert_title')}</h3>
            <p className="detail-desc">{t('config.alert_desc')}</p>
            <div className="alert-toggle-row">
              <label className="toggle">
                <input type="checkbox" checked={currentConfig?.alertEnabled !== false}
                  onChange={() => saveConfig({
                    providerId: provider.id, enabled: currentConfig?.enabled !== false,
                    apiKey: currentConfig?.apiKey ?? '', displayName: currentConfig?.displayName ?? '',
                    alertEnabled: !(currentConfig?.alertEnabled !== false),
                  })} />
                <span className="toggle-slider" />
              </label>
              <span>{currentConfig?.alertEnabled !== false ? t('config.alert_on') : t('config.alert_off')}</span>
            </div>
          </section>
        )}

        {!provider.capabilities.canFetchBalance && (
          <section className="detail-section">
            <h3>{t('config.status_only_title')}</h3>
            <p className="detail-desc">{t('config.status_only_desc')}</p>
            <span className="badge badge-info">{t('config.status_only_badge')}</span>
          </section>
        )}

        <section className="detail-section">
          <h3>{t('config.links')}</h3>
          <div className="detail-links">
            {provider.baseUrl && (
              <a href={provider.baseUrl} target="_blank" rel="noopener" className="detail-link">{t('config.console')}</a>
            )}
            {provider.statusPageUrl && (
              <a href={provider.statusPageUrl} target="_blank" rel="noopener" className="detail-link">{t('config.status_page')}</a>
            )}
          </div>
        </section>

        {provider.capabilities.canFetchBalance && currentConfig?.apiKey && (
          <section className="detail-section">
            <BalanceHistoryChart providerId={provider.id} />
          </section>
        )}
      </main>
    </div>
  );
};

export default ProviderDetail;
