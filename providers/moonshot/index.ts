import { t } from '@/utils/i18n';
import type { Provider, BalanceResult, StatusResult } from '@/types';

const MOONSHOT_BALANCE_URL = 'https://api.moonshot.cn/v1/users/me/balance';

async function fetchBalance(apiKey: string): Promise<BalanceResult> {
  const res = await fetch(MOONSHOT_BALANCE_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return {
      success: false,
      balances: [],
      rawTimestamp: Date.now(),
      error: `HTTP ${res.status}`,
    };
  }

  const json = await res.json();
  const data = json?.data ?? json;
  const totalBalance = parseFloat(data?.balance ?? data?.total_balance ?? '0');

  return {
    success: true,
    balances: [{
      currency: 'CNY',
      totalBalance,
      grantedBalance: 0,
      toppedUpBalance: 0,
    }],
    rawTimestamp: Date.now(),
  };
}

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.moonshot.cn/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
    const isAvailable = res.status < 500;
    return {
      success: true,
      isAvailable,
      statusMessage: isAvailable ? t('status.running') : `${t('status.error')} (HTTP ${res.status})`,
      rawTimestamp: Date.now(),
    };
  } catch {
    return {
      success: false,
      isAvailable: false,
      statusMessage: t('status.unreachable'),
      rawTimestamp: Date.now(),
    };
  }
}

function validateApiKey(key: string): boolean {
  return /^sk-[a-zA-Z0-9]{20,}$/.test(key);
}

export const moonshotProvider: Provider = {
  id: 'moonshot',
  name: 'Kimi',
  company: '月之暗面 Moonshot AI',
  description: 'Kimi 智能助手',
  icon: '🚀',
  faviconUrl: 'https://platform.kimi.com/favicon.ico',
  baseUrl: 'https://platform.moonshot.cn',
  capabilities: {
    canFetchBalance: true,
    canFetchStatus: true,
  },
  fetchBalance,
  fetchStatus,
  validateApiKey,
};
