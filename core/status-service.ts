import type { Provider, StatusCacheEntry } from '@/types';
import { setStatusCacheEntry, appendStatusHistoryEntry } from './storage';

export async function fetchAndCacheStatus(provider: Provider): Promise<StatusCacheEntry> {
  if (!provider.fetchStatus) {
    return {
      providerId: provider.id,
      lastFetchTimestamp: Date.now(),
      lastSuccessTimestamp: 0,
      result: null,
    };
  }

  const result = await provider.fetchStatus();

  const entry: StatusCacheEntry = {
    providerId: provider.id,
    lastFetchTimestamp: Date.now(),
    lastSuccessTimestamp: result.success ? Date.now() : 0,
    result,
  };

  await setStatusCacheEntry(entry);

  // Append to status history
  if (result) {
    await appendStatusHistoryEntry(provider.id, {
      timestamp: Date.now(),
      isAvailable: result.isAvailable,
      statusMessage: result.statusMessage,
    });
  }

  return entry;
}
