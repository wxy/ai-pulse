import React from 'react';
import type { StatusResult } from '@/types';
import { t } from '@/utils/i18n';

interface StatusIndicatorProps {
  status: StatusResult | null;
  providerName: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  if (!status) {
    return (
      <div className="status-indicator">
        <span className="status-dot status-unknown" />
        <span className="status-label">{t('status.unknown')}</span>
      </div>
    );
  }

  const kind = status.statusKind ?? (status.isAvailable ? 'ok' : 'down');
  const config = {
    ok: { cls: 'status-ok', label: t('status.running') },
    warning: { cls: 'status-warning', label: t('status.warning') },
    down: { cls: 'status-error', label: t('status.error') },
  }[kind];
  const source = status.source ?? 'api';
  const sourceLabel = source === 'page' ? t('status.source_page') : source === 'merged' ? t('status.source_merged') : t('status.source_api');
  const sourceCls = source === 'page' ? 'status-source-page' : source === 'merged' ? 'status-source-merged' : '';

  return (
    <div className="status-indicator" title={`${status.statusMessage} · ${sourceLabel}`}>
      <span className={`status-dot ${config.cls} ${sourceCls}`} />
      <span className="status-label">{config.label}</span>
    </div>
  );
};

export default StatusIndicator;
