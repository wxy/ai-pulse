import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const mistralProvider: Provider = {
  id: 'mistral',
  name: 'Mistral AI',
  company: 'Mistral AI',
  description: 'Mistral / Mixtral / Codestral',
  icon: '🌪️',
  faviconUrl: 'https://mistral.ai/favicon.ico',
  baseUrl: 'https://console.mistral.ai',
  statusPageUrl: 'https://status.mistral.ai',
  statusPageApiUrl: 'https://status.mistral.ai/api/v2/status.json',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  noBalanceNote: 'provider.mistral.no_balance_note',
  fetchStatus,
};
