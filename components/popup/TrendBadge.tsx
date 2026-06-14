import React from 'react';
import type { ProviderSummary } from '@/types';

interface TrendBadgeProps {
  trend: ProviderSummary['trend'];
}

const TREND_CONFIG: Record<ProviderSummary['trend'], { icon: string; label: string; className: string }> = {
  up:   { icon: '▲', label: '余额增长', className: 'trend-up' },
  down: { icon: '▼', label: '余额减少', className: 'trend-down' },
  flat: { icon: '→', label: '余额持平', className: 'trend-flat' },
  unknown: { icon: '', label: '', className: 'trend-unknown' },
};

const TrendBadge: React.FC<TrendBadgeProps> = ({ trend }) => {
  const config = TREND_CONFIG[trend];

  // Don't show anything when trend is unknown
  if (trend === 'unknown') return null;

  return (
    <span className={`trend-badge ${config.className}`} title={config.label}>
      {config.icon}
    </span>
  );
};

export default TrendBadge;
