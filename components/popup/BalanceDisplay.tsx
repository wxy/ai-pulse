import React from 'react';
import type { BalanceEntry } from '@/types';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';
import { t } from '@/utils/i18n';

interface BalanceDisplayProps { balances: BalanceEntry[]; hasApiKey: boolean; providerId: string; onSelect: () => void; canFetchBalance?: boolean; noBalanceNote?: string; }

function useStats(providerId: string, currency: string | null, balance: number): { dailyAvg: string | null; daysLeft: string | null } {
  const { chartData } = useBalanceHistory(providerId);
  if (chartData.length < 2 || !currency) return { dailyAvg: null, daysLeft: null };
  const first = chartData[0], last = chartData[chartData.length - 1];
  const daysDiff = Math.max(1, (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));
  const firstVal = first[currency] as number | undefined;
  const lastVal = last[currency] as number | undefined;
  if (typeof firstVal !== 'number' || typeof lastVal !== 'number') return { dailyAvg: null, daysLeft: null };
  const consumed = firstVal - lastVal;
  if (consumed <= 0) return { dailyAvg: null, daysLeft: null };
  const daily = consumed / daysDiff;
  const prefix = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : '';
  const daysLeft = daily > 0 ? Math.round(balance / daily) : null;
  return {
    dailyAvg: `${prefix}${daily.toFixed(2)}/${t('card.daily_avg')}`,
    daysLeft: daysLeft ? `${daysLeft}d` : null,
  };
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balances, hasApiKey, providerId, onSelect, canFetchBalance, noBalanceNote }) => {
  const bal = balances[0];
  const stats = useStats(providerId, bal?.currency ?? null, bal?.totalBalance ?? 0);

  if (canFetchBalance === false && noBalanceNote) {
    return (
      <div className="balance-display">
        <p className="no-data-hint">{t(noBalanceNote)}</p>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="balance-display">
        <button className="add-key-prompt" onClick={onSelect} title={t('card.click_config')}>
          + {t('popup.no_key')}
        </button>
      </div>
    );
  }

  if (balances.length === 0) {
    return <div className="balance-display"><p className="no-data-hint">{t('popup.no_data')}</p></div>;
  }

  return (
    <div className="balance-display">
      {balances.map((entry, i) => (
        <div key={i} className="balance-entry">
          <span className="balance-currency">{entry.currency}</span>
          <span className="balance-amount">
            {entry.currency === 'CNY' ? `¥${entry.totalBalance.toFixed(2)}` : entry.totalBalance.toLocaleString()}
          </span>
          {stats.dailyAvg && <span className="daily-avg-inline">{stats.dailyAvg}</span>}
          {stats.daysLeft && <span className="days-left-inline">{stats.daysLeft}</span>}
          {entry.grantedBalance > 0 && (
            <div className="balance-detail">
              <span className="balance-sub">{t('popup.granted')} {entry.currency === 'CNY' ? '¥' : entry.currency === 'USD' ? '$' : ''}{entry.grantedBalance.toFixed(2)}</span>
              <span className="balance-sub">{t('popup.topped_up')} {entry.currency === 'CNY' ? '¥' : entry.currency === 'USD' ? '$' : ''}{entry.toppedUpBalance.toFixed(2)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BalanceDisplay;
