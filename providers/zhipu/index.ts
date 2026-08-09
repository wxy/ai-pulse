import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, BalanceResult, StatusResult } from '@/types';

const ZHIPU_BALANCE_URL = 'https://www.bigmodel.cn/api/biz/account/query-customer-account-report';

async function fetchBalance(apiKey: string): Promise<BalanceResult> {
  const res = await fetch(ZHIPU_BALANCE_URL, {
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
  const balance = json?.balance ?? json?.data ?? {};
  const available = balance?.availableBalance ?? balance?.balance ?? 0;
  const totalBalance = typeof available === 'number' ? available : parseFloat(String(available));

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

async function fetchStatus(apiKey?: string): Promise<StatusResult> {
  try {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/models', {
      headers: { Authorization: `Bearer ${apiKey ?? 'noop'}` },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const zhipuProvider: Provider = {
  id: 'zhipu',
  name: 'ChatGLM',
  company: '智谱 Zhipu AI',
  description: '智谱 AI 开放平台',
  icon: '🧠',
  faviconUrl: 'https://www.bigmodel.cn/favicon.ico',
  baseUrl: 'https://open.bigmodel.cn',
  capabilities: {
    canFetchBalance: true,
    canFetchStatus: true,
  },
  fetchBalance,
  fetchStatus,
};
