import { statusFromResponse, statusFromError } from '@/core/status-classifier';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://qianfan.baidubce.com/v2/models');
    return statusFromResponse(res);
  } catch (err) {
    return statusFromError(err);
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
  noBalanceNote: 'provider.ernie.no_balance_note',
  fetchStatus,
};
