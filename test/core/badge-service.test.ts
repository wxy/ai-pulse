import { describe, it, expect, beforeEach } from 'vitest';
import { updateBadge } from '@/core/badge-service';

describe('badge-service', () => {
  beforeEach(async () => {
    await chrome.storage.local.set({
      provider_configs: [],
      balance_cache: {},
      status_cache: {},
    });
  });

  it('clears badge text and writes a tooltip title', async () => {
    await updateBadge();
    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' });
    expect(chrome.action.setTitle).toHaveBeenCalled();
  });

  it('marks warning status with ~ in the tooltip', async () => {
    await chrome.storage.local.set({
      provider_configs: [{ providerId: 'deepseek', enabled: true, apiKey: 'sk-test', displayName: '', alertEnabled: false }],
      status_cache: {
        deepseek: {
          providerId: 'deepseek',
          lastFetchTimestamp: Date.now(),
          lastSuccessTimestamp: Date.now(),
          result: { success: true, isAvailable: true, statusKind: 'warning', statusMessage: '可达 · 需鉴权', rawTimestamp: Date.now() },
        },
      },
    });

    await updateBadge();
    const calls = (chrome.action.setTitle as any).mock.calls;
    const title: string = calls[calls.length - 1][0].title;
    expect(title).toContain('~');
  });

  it('marks ok status with ✓ in the tooltip', async () => {
    await chrome.storage.local.set({
      provider_configs: [{ providerId: 'deepseek', enabled: true, apiKey: 'sk-test', displayName: '', alertEnabled: false }],
      status_cache: {
        deepseek: {
          providerId: 'deepseek',
          lastFetchTimestamp: Date.now(),
          lastSuccessTimestamp: Date.now(),
          result: { success: true, isAvailable: true, statusKind: 'ok', statusMessage: '运行中', rawTimestamp: Date.now() },
        },
      },
    });

    await updateBadge();
    const calls = (chrome.action.setTitle as any).mock.calls;
    const title: string = calls[calls.length - 1][0].title;
    expect(title).toContain('✓');
  });
});
