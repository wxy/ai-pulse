import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': 'noop', 'anthropic-version': '2023-06-01' },
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

export const anthropicProvider: Provider = {
  id: 'anthropic',
  name: 'Anthropic',
  company: 'Anthropic',
  description: 'Claude / Sonnet / Opus / Haiku',
  icon: '🧪',
  faviconUrl: 'https://anthropic.com/favicon.ico',
  baseUrl: 'https://console.anthropic.com',
  statusPageUrl: 'https://status.anthropic.com',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  fetchStatus,
};
