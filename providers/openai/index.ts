import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, BalanceResult, StatusResult } from '@/types';

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

async function fetchStatus(apiKey?: string): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey ?? 'noop'}` },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
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
  statusPageApiUrl: 'https://status.openai.com/api/v2/status.json',
  balanceType: 'usage',
  capabilities: {
    canFetchBalance: true,
    canFetchStatus: true,
  },
  fetchBalance,
  fetchStatus,
};
