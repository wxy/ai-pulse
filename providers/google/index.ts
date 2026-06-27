import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=noop');
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
