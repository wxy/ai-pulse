import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
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

export const openaiProvider: Provider = {
  id: 'openai',
  name: 'OpenAI',
  company: 'OpenAI',
  description: 'GPT / ChatGPT / Sora',
  icon: '🤖',
  faviconUrl: 'https://openai.com/favicon.ico',
  baseUrl: 'https://platform.openai.com',
  statusPageUrl: 'https://status.openai.com',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  fetchStatus,
};
