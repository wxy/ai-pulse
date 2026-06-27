import { t } from '@/utils/i18n';
import type { Provider, StatusResult } from '@/types';

async function fetchStatus(): Promise<StatusResult> {
  try {
    const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/models');
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

export const qwenProvider: Provider = {
  id: 'qwen',
  name: '通义千问',
  company: '阿里云 Alibaba Cloud',
  description: '阿里云通义大模型',
  icon: '☁️',
  faviconUrl: 'https://img.alicdn.com/imgextra/i4/O1CN01Qd3F9s1ilWmLJo56P_!!6000000004453-55-tps-51-51.svg',
  baseUrl: 'https://bailian.console.aliyun.com',
  capabilities: {
    canFetchBalance: false,
    canFetchStatus: true,
  },
  noBalanceNote: 'provider.qwen.no_balance_note',
  fetchStatus,
};
