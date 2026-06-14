import { t } from '@/utils/i18n';
import type { Provider, BalanceResult, StatusResult } from '@/types';

const ZHIPU_QUOTA_URL = 'https://bigmodel.cn/api/monitor/usage/quota/limit';

async function fetchBalance(apiKey: string): Promise<BalanceResult> {
  const res = await fetch(ZHIPU_QUOTA_URL, {
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
  const limits = json?.data?.limits ?? [];
  const tokenLimit = limits.find((l: { type: string }) => l.type === 'TOKENS_LIMIT');

  return {
    success: true,
    balances: [{
      currency: 'tokens',
      totalBalance: tokenLimit?.remaining ?? tokenLimit?.currentValue ?? 0,
      grantedBalance: 0,
      toppedUpBalance: 0,
    }],
    rawTimestamp: Date.now(),
  };
}

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/models');
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
