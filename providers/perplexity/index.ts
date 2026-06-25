import type { Provider, StatusResult } from '@/types';
import { t } from '@/utils/i18n';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer noop', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
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

export const perplexityProvider: Provider = {
  id: 'perplexity',
  name: 'Perplexity',
  company: 'Perplexity AI',
  description: 'Perplexity / Sonar',
  icon: '🔎',
  faviconUrl: 'https://perplexity.ai/favicon.ico',
  baseUrl: 'https://www.perplexity.ai',
  capabilities: { canFetchBalance: false, canFetchStatus: true },
  fetchStatus,
};
