import type { Provider, BalanceCacheEntry } from '@/types';
import { setBalanceCacheEntry, appendBalanceSnapshot, getSettings } from './storage';

export async function fetchAndCacheBalance(provider: Provider, apiKey: string): Promise<BalanceCacheEntry> {
  if (!provider.fetchBalance) {
    return {
      providerId: provider.id,
      lastFetchTimestamp: Date.now(),
      lastSuccessTimestamp: 0,
      result: null,
    };
  }

  const result = await provider.fetchBalance(apiKey);

  const entry: BalanceCacheEntry = {
    providerId: provider.id,
    lastFetchTimestamp: Date.now(),
    lastSuccessTimestamp: result.success ? Date.now() : 0,
    result,
  };

  await setBalanceCacheEntry(entry);

  // Append to history on successful fetch
  if (result.success && result.balances.length > 0) {
    const settings = await getSettings();
    await appendBalanceSnapshot(provider.id, {
      timestamp: Date.now(),
      balances: result.balances,
    }, settings.historyRetentionDays);
  }

  return entry;
}
