import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.cohere.ai/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
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

export const cohereProvider: Provider = {
  id: 'cohere',
  name: 'Cohere',
  company: 'Cohere',
  description: 'Command / Embed / Rerank',
  icon: '🤝',
  faviconUrl: 'https://cohere.com/favicon.ico',
  baseUrl: 'https://dashboard.cohere.com',
  statusPageUrl: 'https://status.cohere.com',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  fetchStatus,
};
