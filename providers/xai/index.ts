import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const xaiProvider: Provider = {
  id: 'xai',
  name: 'Grok',
  company: 'xAI',
  description: 'Grok / xAI',
  icon: '❌',
  faviconUrl: 'https://x.ai/favicon.ico',
  baseUrl: 'https://console.x.ai',
  statusPageUrl: 'https://status.x.ai',
  statusPageApiUrl: 'https://status.x.ai/api/v2/status.json',
  capabilities: { canFetchBalance: false, canFetchStatus: true },
  noBalanceNote: 'provider.xai.no_balance_note',
  fetchStatus,
};
