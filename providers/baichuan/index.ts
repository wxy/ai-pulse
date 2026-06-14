import { t } from '@/utils/i18n';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://api.baichuan-ai.com/v1/models');
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

export const baichuanProvider: Provider = {
  id: 'baichuan',
  name: '百川智能',
  company: '百川智能 Baichuan',
  description: '百川大模型平台',
  icon: '🌊',
  faviconUrl: 'https://www.baichuan-ai.com/favicon.ico',
  baseUrl: 'https://platform.baichuan-ai.com',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  fetchStatus,
};
