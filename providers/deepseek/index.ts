import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, BalanceResult, StatusResult } from '@/types';

const DEEPSEEK_BALANCE_URL = 'https://api.deepseek.com/user/balance';

async function fetchBalance(apiKey: string): Promise<BalanceResult> {
  const res = await fetch(DEEPSEEK_BALANCE_URL, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    return {
      success: false,
      balances: [],
      rawTimestamp: Date.now(),
      error: `HTTP ${res.status}: ${errorText}`,
    };
  }

  const json = await res.json();
  const balances = (json.balance_infos ?? []).map((b: {
    currency: string;
    total_balance: string;
    granted_balance: string;
    topped_up_balance: string;
  }) => ({
    currency: b.currency,
    totalBalance: parseFloat(b.total_balance),
    grantedBalance: parseFloat(b.granted_balance),
    toppedUpBalance: parseFloat(b.topped_up_balance),
  }));

  return {
    success: true,
    balances,
    rawTimestamp: Date.now(),
  };
}

async function fetchStatus(apiKey?: string): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.deepseek.com/models', {
      headers: { Authorization: `Bearer ${apiKey ?? 'noop'}` },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

function validateApiKey(key: string): boolean {
  return /^sk-[a-zA-Z0-9]{20,}$/.test(key);
}

export const deepseekProvider: Provider = {
  id: 'deepseek',
  name: 'DeepSeek',
  company: '深度求索 DeepSeek',
  description: 'DeepSeek AI 大模型平台',
  icon: '🔍',
  faviconUrl: 'https://www.deepseek.com/favicon.ico',
  baseUrl: 'https://platform.deepseek.com',
  statusPageUrl: 'https://status.deepseek.com',
  statusPageApiUrl: 'https://status.deepseek.com/api/v2/status.json',
  capabilities: {
    canFetchBalance: true,
    canFetchStatus: true,
  },
  fetchBalance,
  fetchStatus,
  validateApiKey,
};
