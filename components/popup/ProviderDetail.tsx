import React from 'react';
import type { ProviderSummary } from '@/types';
import ProviderIcon from '@/components/shared/ProviderIcon';
import ApiKeyManager from '@/components/options/ApiKeyManager';
import BalanceHistoryChart from '@/components/options/BalanceHistoryChart';
import { t } from '@/utils/i18n';
import { useProviderConfigs } from '@/hooks/useProviderStatus';

interface ProviderDetailProps { summary: ProviderSummary; onBack: () => void; }

const ProviderDetail: React.FC<ProviderDetailProps> = ({ summary, onBack }) => {
  const { provider, config, balanceCache, statusCache } = summary;
  const { saveConfig } = useProviderConfigs();

  const handleSaveKey = async (key: string) => {
    await saveConfig({
      providerId: provider.id, enabled: config?.enabled !== false,
      apiKey: key, displayName: config?.displayName ?? '',
      alertEnabled: config?.alertEnabled !== false,
    });
  };

  return (
    <div className="provider-detail">
      <header className="app-header">
        <button className="back-button" onClick={onBack}>← {t('config.back')}</button>
      </header>
      <main className="detail-body">
        <div className="provider-config-header">
          <ProviderIcon provider={provider} size={40} />
          <div><h2>{config?.displayName || provider.name}</h2><p>{provider.company} · {provider.description}</p></div>
        </div>

        {provider.capabilities.canFetchBalance && (
          <section className="detail-section">
            <h3>{t('config.api_key')}</h3>
            <ApiKeyManager providerId={provider.id} currentKey={config?.apiKey ?? ''} provider={provider} onSave={handleSaveKey} />
          </section>
        )}

        {provider.capabilities.canFetchBalance && config?.apiKey && (
          <section className="detail-section">
            <BalanceHistoryChart providerId={provider.id} />
          </section>
        )}
      </main>
    </div>
  );
};

export default ProviderDetail;
