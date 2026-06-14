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

  const isAvailable = status.success && status.isAvailable;

  return (
    <div className="status-indicator" title={status.statusMessage}>
      <span className={`status-dot ${isAvailable ? 'status-ok' : 'status-error'}`} />
      <span className="status-label">
        {isAvailable ? t('status.running') : t('status.error')}
      </span>
    </div>
  );
};

export default StatusIndicator;
