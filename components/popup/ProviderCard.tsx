import React from 'react';
import type { ProviderSummary } from '@/types';
import ProviderIcon from '@/components/shared/ProviderIcon';
import StatusIndicator from './StatusIndicator';
import StatusTimeline from './StatusTimeline';
import BalanceDisplay from './BalanceDisplay';
import TrendBadge from './TrendBadge';
import LastUpdatedLabel from './LastUpdatedLabel';
import { t } from '@/utils/i18n';

interface ProviderCardProps { summary: ProviderSummary; onSelect: () => void; }

const ProviderCard: React.FC<ProviderCardProps> = ({ summary, onSelect }) => {
  const { provider, config, balanceCache, statusCache, trend } = summary;
  const hasApiKey = Boolean(config?.enabled && config?.apiKey);
  const lastUpdate = Math.max(balanceCache?.lastFetchTimestamp ?? 0, statusCache?.lastFetchTimestamp ?? 0);

  return (
    <div className="provider-card" onClick={onSelect} title={`${t('card.click_config')} ${config?.displayName || provider.name}`}>
      <div className="provider-card-header">
        <ProviderIcon provider={provider} size={28} />
        <div className="provider-info">
          <h3 className="provider-name">{config?.displayName || provider.name}</h3>
          <p className="provider-desc">{provider.company}</p>
        </div>
        <div className="provider-meta">
          <StatusIndicator status={statusCache?.result ?? null} providerName={provider.name} />
          <TrendBadge trend={trend} />
        </div>
      </div>
      <div className="provider-card-body">
        <BalanceDisplay balances={balanceCache?.result?.balances ?? []} hasApiKey={hasApiKey} providerId={provider.id} />
      </div>
      <div className="provider-card-footer">
        <StatusTimeline providerId={provider.id} />
        <LastUpdatedLabel timestamp={lastUpdate} />
        {balanceCache?.result?.error && <span className="error-badge" title={balanceCache.result.error}>⚠️</span>}
      </div>
    </div>
  );
};

export default ProviderCard;
