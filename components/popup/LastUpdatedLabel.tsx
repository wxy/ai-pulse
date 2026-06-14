import React from 'react';
import { t } from '@/utils/i18n';

interface LastUpdatedLabelProps {
  timestamp: number;
}

function timeAgo(ts: number): string {
  if (ts === 0) return t('popup.never');

  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return t('popup.just_now');
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('popup.min_ago')}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('popup.hour_ago')}`;
  return `${Math.floor(seconds / 86400)} ${t('popup.day_ago')}`;
}

const LastUpdatedLabel: React.FC<LastUpdatedLabelProps> = ({ timestamp }) => {
  return (
    <span className="last-updated-label">
      {t('popup.updated')} {timeAgo(timestamp)}
    </span>
  );
};

export default LastUpdatedLabel;
