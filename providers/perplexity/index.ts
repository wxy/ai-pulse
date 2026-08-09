import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer noop', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const perplexityProvider: Provider = {
  id: 'perplexity',
  name: 'Perplexity',
  company: 'Perplexity AI',
  description: 'Perplexity / Sonar',
  icon: '🔎',
  faviconUrl: 'https://perplexity.ai/favicon.ico',
  baseUrl: 'https://www.perplexity.ai',
  statusPageUrl: 'https://status.perplexity.com',
  statusPageApiUrl: 'https://status.perplexity.com/api/v2/status.json',
  capabilities: { canFetchBalance: false, canFetchStatus: true },
  noBalanceNote: 'provider.perplexity.no_balance_note',
  fetchStatus,
};
