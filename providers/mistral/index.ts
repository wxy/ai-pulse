import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
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

export const mistralProvider: Provider = {
  id: 'mistral',
  name: 'Mistral AI',
  company: 'Mistral AI',
  description: 'Mistral / Mixtral / Codestral',
  icon: '🌪️',
  faviconUrl: 'https://mistral.ai/favicon.ico',
  baseUrl: 'https://console.mistral.ai',
  statusPageUrl: 'https://status.mistral.ai',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  fetchStatus,
};
