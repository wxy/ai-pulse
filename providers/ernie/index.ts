import { t } from '@/utils/i18n';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://qianfan.baidubce.com/v2/models');
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

export const ernieProvider: Provider = {
  id: 'ernie',
  name: '文心一言',
  company: '百度 Baidu',
  description: '百度文心大模型',
  icon: '🐻',
  faviconUrl: 'https://eb-static.cdn.bcebos.com/logo/favicon.ico',
  baseUrl: 'https://console.bce.baidu.com/qianfan',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  fetchStatus,
};
