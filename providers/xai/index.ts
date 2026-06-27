import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.x.ai/v1/models', {
      headers: { Authorization: 'Bearer noop' },
    });
    const isAvailable = res.status < 500;
    return {
      success: true, isAvailable,
      statusMessage: isAvailable ? t('status.running') : `${t('status.error')} (HTTP ${res.status})`,
      rawTimestamp: Date.now(),
    };
  } catch {
    return { success: false, isAvailable: false, statusMessage: t('status.unreachable'), rawTimestamp: Date.now() };
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
  capabilities: { canFetchBalance: false, canFetchStatus: true },
  noBalanceNote: 'provider.xai.no_balance_note',
  fetchStatus,
};
