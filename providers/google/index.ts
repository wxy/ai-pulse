import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=noop');
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
  }
}

export const googleProvider: Provider = {
  id: 'google',
  name: 'Google AI',
  company: 'Google DeepMind',
  description: 'Gemini / Imagen / Veo',
  icon: '💎',
  faviconUrl: 'https://ai.google.dev/favicon.ico',
  baseUrl: 'https://aistudio.google.com',
  statusPageUrl: 'https://status.cloud.google.com',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  noBalanceNote: 'provider.google.no_balance_note',
  fetchStatus,
};
