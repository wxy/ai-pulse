import type { Provider, BalanceResult, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchBalance(apiKey: string): Promise<BalanceResult> {
  // OpenAI Usage API — get today's cost as an indicator
  const today = new Date().toISOString().slice(0, 10);
  let totalCost = 0;

  try {
    // Fetch last 3 days of usage and sum as estimate
    for (let i = 0; i < 3; i++) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      const res = await fetch(`https://api.openai.com/v1/usage?date=${d}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        totalCost += (json?.total_usage ?? 0) / 100; // Convert cents to dollars
      } else if (res.status === 401 || res.status === 403) {
        return { success: false, balances: [], rawTimestamp: Date.now(), error: `HTTP ${res.status}` };
      }
    }
  } catch (err) {
    return { success: false, balances: [], rawTimestamp: Date.now(), error: String(err) };
  }

  return {
    success: true,
    balances: [{
      currency: 'USD',
      totalBalance: Math.round(totalCost * 100) / 100,
      grantedBalance: 0,
      toppedUpBalance: 0,
    }],
    rawTimestamp: Date.now(),
  };
}

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
    const isAvailable = res.status < 500;
    return {
      success: true, isAvailable,
      statusMessage: isAvailable ? t('status.running') : `${t('status.error')} (HTTP ${res.status})`,
      rawTimestamp: Date.now(),
    };
  } catch {
    return { success: false, isAvailable: false, statusMessage: t('status.unreachable'), rawTimestamp: Date.now() };
  }
}

export const openaiProvider: Provider = {
  id: 'openai',
  name: 'OpenAI',
  company: 'OpenAI',
  description: 'GPT / ChatGPT / Sora · 近3日消费',
  icon: '🤖',
  faviconUrl: 'https://openai.com/favicon.ico',
  baseUrl: 'https://platform.openai.com',
  statusPageUrl: 'https://status.openai.com',
  balanceType: 'usage',
  capabilities: {
    canFetchBalance: true,
    canFetchStatus: true,
  },
  fetchBalance,
  fetchStatus,
};
