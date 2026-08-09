import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.cohere.ai/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const cohereProvider: Provider = {
  id: 'cohere',
  name: 'Cohere',
  company: 'Cohere',
  description: 'Command / Embed / Rerank',
  icon: '🤝',
  faviconUrl: 'https://cohere.com/favicon.ico',
  baseUrl: 'https://dashboard.cohere.com',
  statusPageUrl: 'https://status.cohere.com',
  statusPageApiUrl: 'https://status.cohere.com/api/v2/status.json',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  noBalanceNote: 'provider.cohere.no_balance_note',
  fetchStatus,
};
