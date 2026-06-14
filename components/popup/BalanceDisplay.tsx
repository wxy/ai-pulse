import { useI18n } from '@/utils/i18n';
import React from 'react';
import type { BalanceEntry } from '@/types';

interface BalanceDisplayProps {
  balances: BalanceEntry[];
  hasApiKey: boolean;
  providerId: string;
}

async function openOptionsForProvider(providerId: string) {
  // Store intent BEFORE opening options page so it's available on load
  await chrome.storage.local.set({ navigate_to_provider: providerId });
  chrome.runtime.openOptionsPage();
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ balances, hasApiKey, providerId }) => {
  if (!hasApiKey) {
    return (
      <div className="balance-display">
        <button
          className="add-key-prompt"
          onClick={() => openOptionsForProvider(providerId)}
          title="点击配置 API Key"
        >
          + 添加 API Key 以监控余额
        </button>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="balance-display">
        <p className="no-data-hint">暂无余额数据</p>
      </div>
    );
  }

  return (
    <div className="balance-display">
      {balances.map((entry, i) => (
        <div key={i} className="balance-entry">
          <span className="balance-currency">{entry.currency}</span>
          <span className="balance-amount">
            {entry.currency === 'CNY'
              ? `¥${entry.totalBalance.toFixed(2)}`
              : entry.totalBalance.toLocaleString()}
          </span>
          {entry.grantedBalance > 0 && (
            <div className="balance-detail">
              <span className="balance-sub">赠送 ¥{entry.grantedBalance.toFixed(2)}</span>
              <span className="balance-sub">充值 ¥{entry.toppedUpBalance.toFixed(2)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BalanceDisplay;
