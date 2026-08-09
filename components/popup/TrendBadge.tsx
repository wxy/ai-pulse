import React from 'react';
import type { ProviderSummary } from '@/types';
import { t } from '@/utils/i18n';

interface TrendBadgeProps {
  trend: ProviderSummary['trend'];
  usage?: boolean;
}

const TREND_ICON: Record<ProviderSummary['trend'], string> = {
  up: '▲',
  down: '▼',
  flat: '→',
  unknown: '',
};

const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, usage = false }) => {
  const trendKey = trend === 'unknown' ? '' : usage ? `trend.usage_${trend}` : `trend.${trend}`;

  // Don't show anything when trend is unknown
  if (trend === 'unknown') return null;

  return (
    <span className={`trend-badge trend-${trend}`} title={t(trendKey)}>
      {TREND_ICON[trend]}
    </span>
  );
};

export default TrendBadge;
