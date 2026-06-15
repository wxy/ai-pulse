import React from 'react';
import type { BalanceEntry } from '@/types';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';
import { t } from '@/utils/i18n';

interface BalanceDisplayProps { balances: BalanceEntry[]; hasApiKey: boolean; providerId: string; }

async function openOptionsForProvider(providerId: string) {
  await chrome.storage.local.set({ navigate_to_provider: providerId });
  chrome.runtime.openOptionsPage();
}

function useDailyAvg(providerId: string): string | null {
  const { chartData } = useBalanceHistory(providerId);
  if (chartData.length < 2) return null;
  const first = chartData[0], last = chartData[chartData.length - 1];
  const daysDiff = Math.max(1, (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));
  const firstCNY = first['CNY'] as number | undefined;
  const lastCNY = last['CNY'] as number | undefined;
  if (typeof firstCNY !== 'number' || typeof lastCNY !== 'number') return null;
  const consumed = firstCNY - lastCNY;
  if (consumed <= 0) return null;
  return `¥${(consumed / daysDiff).toFixed(2)}/${t('card.daily_avg')}`;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balances, hasApiKey, providerId }) => {
  const dailyAvg = useDailyAvg(providerId);

  if (!hasApiKey) {
    return (
      <div className="balance-display">
        <button className="add-key-prompt" onClick={() => openOptionsForProvider(providerId)} title={t('card.click_config')}>
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
          {dailyAvg && <span className="daily-avg-inline">{dailyAvg}</span>}
          {entry.grantedBalance > 0 && (
            <div className="balance-detail">
              <span className="balance-sub">{t('popup.granted')} ¥{entry.grantedBalance.toFixed(2)}</span>
              <span className="balance-sub">{t('popup.topped_up')} ¥{entry.toppedUpBalance.toFixed(2)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BalanceDisplay;
