import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSettings, setSettings,
  getProviderConfigs, setProviderConfig, deleteProviderConfig,
  getBalanceCache, setBalanceCacheEntry,
  getStatusCache, setStatusCacheEntry,
  getBalanceHistory, appendBalanceSnapshot, clearBalanceHistory,
} from '@/core/storage';

describe('storage', () => {
  beforeEach(() => {
    // Reset chrome.storage mock
  });

  describe('settings', () => {
    it('returns defaults when no settings exist', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({});
      const s = await getSettings();
      expect(s.refreshIntervalMinutes).toBe(60);
      expect(['dark', 'light']).toContain(s.theme);
      expect(s.historyRetentionDays).toBe(90);
    });

    it('saves and retrieves settings', async () => {
      await setSettings({ refreshIntervalMinutes: 30, theme: 'light', historyRetentionDays: 7 });
      (chrome.storage.local.get as any).mockResolvedValueOnce({
        settings: { refreshIntervalMinutes: 30, theme: 'light', historyRetentionDays: 7 },
      });
      const s = await getSettings();
      expect(s.refreshIntervalMinutes).toBe(30);
      expect(s.theme).toBe('light');
    });
  });

  describe('provider configs', () => {
    it('returns empty array when no configs exist', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({});
      const configs = await getProviderConfigs();
      expect(configs).toEqual([]);
    });

    it('saves and retrieves provider configs', async () => {
      const config = { providerId: 'deepseek', enabled: true, apiKey: 'sk-test', displayName: '', alertEnabled: true };
      await setProviderConfig(config);
      (chrome.storage.local.get as any).mockResolvedValueOnce({ provider_configs: [config] });
      const configs = await getProviderConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].providerId).toBe('deepseek');
    });

    it('deletes provider config', async () => {
      const config = { providerId: 'test', enabled: true, apiKey: '', displayName: '', alertEnabled: false };
      (chrome.storage.local.get as any).mockResolvedValueOnce({ provider_configs: [config] });
      await deleteProviderConfig('test');

      (chrome.storage.local.get as any).mockResolvedValueOnce({ provider_configs: [] });
      const configs = await getProviderConfigs();
      expect(configs).toHaveLength(0);
    });
  });

  describe('balance cache', () => {
    it('returns empty object when no cache exists', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({});
      const cache = await getBalanceCache();
      expect(cache).toEqual({});
    });

    it('stores and retrieves cache entries', async () => {
      const entry = { providerId: 'ds', lastFetchTimestamp: 100, lastSuccessTimestamp: 100, result: null };
      await setBalanceCacheEntry(entry);
      (chrome.storage.local.get as any).mockResolvedValueOnce({ balance_cache: { ds: entry } });
      const cache = await getBalanceCache();
      expect(cache['ds']).toBeDefined();
    });
  });

  describe('balance history', () => {
    it('returns empty snapshots for new provider', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({});
      const history = await getBalanceHistory('test');
      expect(history.snapshots).toEqual([]);
    });

    it('appends and retrieves snapshots', async () => {
      const snapshot = { timestamp: Date.now(), balances: [{ currency: 'CNY', totalBalance: 100, grantedBalance: 0, toppedUpBalance: 0 }] };

      // First call: empty history
      (chrome.storage.local.get as any).mockResolvedValueOnce({});
      await appendBalanceSnapshot('test', snapshot, 90);

      // Second call: history with one entry
      (chrome.storage.local.get as any).mockResolvedValueOnce({ balance_history_test: { providerId: 'test', snapshots: [snapshot] } });
      const history = await getBalanceHistory('test');
      expect(history.snapshots).toHaveLength(1);
      expect(history.snapshots[0].balances[0].totalBalance).toBe(100);
    });

    it('deduplicates same balance snapshots', async () => {
      const snapshot = { timestamp: 100, balances: [{ currency: 'CNY', totalBalance: 100, grantedBalance: 0, toppedUpBalance: 0 }] };
      (chrome.storage.local.get as any).mockResolvedValueOnce({
        balance_history_test: { providerId: 'test', snapshots: [snapshot] },
      });
      await appendBalanceSnapshot('test', { ...snapshot, timestamp: 200 }, 90);
      // set should NOT have been called because balances are identical
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });
});
