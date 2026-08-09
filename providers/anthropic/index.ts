import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': 'noop', 'anthropic-version': '2023-06-01' },
    });
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const anthropicProvider: Provider = {
  id: 'anthropic',
  name: 'Anthropic',
  company: 'Anthropic',
  description: 'Claude / Sonnet / Opus / Haiku',
  icon: '🧪',
  faviconUrl: 'https://anthropic.com/favicon.ico',
  baseUrl: 'https://console.anthropic.com',
  statusPageUrl: 'https://status.anthropic.com',
  statusPageApiUrl: 'https://status.anthropic.com/api/v2/status.json',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  noBalanceNote: 'provider.anthropic.no_balance_note',
  fetchStatus,
};
