import type {
  GlobalSettings,
  ProviderConfig,
  BalanceCacheEntry,
  StatusCacheEntry,
  BalanceHistory,
  BalanceSnapshot,
} from '@/types';

// ============================================================
// Settings
// ============================================================

const SETTINGS_KEY = 'settings';

export async function getSettings(): Promise<GlobalSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return result[SETTINGS_KEY] ?? {
    refreshIntervalMinutes: 60,
    theme: 'light',
    historyRetentionDays: 90,
  };
}

export async function setSettings(settings: GlobalSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

// ============================================================
// Provider Configs
// ============================================================

const CONFIGS_KEY = 'provider_configs';

export async function getProviderConfigs(): Promise<ProviderConfig[]> {
  const result = await chrome.storage.local.get(CONFIGS_KEY);
  return result[CONFIGS_KEY] ?? [];
}

export async function getProviderConfig(providerId: string): Promise<ProviderConfig | null> {
  const configs = await getProviderConfigs();
  return configs.find(c => c.providerId === providerId) ?? null;
}

export async function setProviderConfig(config: ProviderConfig): Promise<void> {
  const configs = await getProviderConfigs();
  const index = configs.findIndex(c => c.providerId === config.providerId);
  if (index >= 0) {
    configs[index] = config;
  } else {
    configs.push(config);
  }
  await chrome.storage.local.set({ [CONFIGS_KEY]: configs });
}

export async function deleteProviderConfig(providerId: string): Promise<void> {
  const configs = await getProviderConfigs();
  await chrome.storage.local.set({
    [CONFIGS_KEY]: configs.filter(c => c.providerId !== providerId),
  });
}

// ============================================================
// Balance Cache
// ============================================================

const BALANCE_CACHE_KEY = 'balance_cache';

export async function getBalanceCache(): Promise<Record<string, BalanceCacheEntry>> {
  const result = await chrome.storage.local.get(BALANCE_CACHE_KEY);
  return result[BALANCE_CACHE_KEY] ?? {};
}

export async function getBalanceCacheEntry(providerId: string): Promise<BalanceCacheEntry | null> {
  const cache = await getBalanceCache();
  return cache[providerId] ?? null;
}

export async function setBalanceCacheEntry(entry: BalanceCacheEntry): Promise<void> {
  const cache = await getBalanceCache();
  cache[entry.providerId] = entry;
  await chrome.storage.local.set({ [BALANCE_CACHE_KEY]: cache });
}

// ============================================================
// Status Cache
// ============================================================

const STATUS_CACHE_KEY = 'status_cache';

export async function getStatusCache(): Promise<Record<string, StatusCacheEntry>> {
  const result = await chrome.storage.local.get(STATUS_CACHE_KEY);
  return result[STATUS_CACHE_KEY] ?? {};
}

export async function getStatusCacheEntry(providerId: string): Promise<StatusCacheEntry | null> {
  const cache = await getStatusCache();
  return cache[providerId] ?? null;
}

export async function setStatusCacheEntry(entry: StatusCacheEntry): Promise<void> {
  const cache = await getStatusCache();
  cache[entry.providerId] = entry;
  await chrome.storage.local.set({ [STATUS_CACHE_KEY]: cache });
}

// ============================================================
// Balance History
// ============================================================

const HISTORY_KEY_PREFIX = 'balance_history_';

function historyKey(providerId: string): string {
  return `${HISTORY_KEY_PREFIX}${providerId}`;
}

export async function getBalanceHistory(providerId: string): Promise<BalanceHistory> {
  const result = await chrome.storage.local.get(historyKey(providerId));
  return result[historyKey(providerId)] ?? { providerId, snapshots: [] };
}

export async function appendBalanceSnapshot(
  providerId: string,
  snapshot: BalanceSnapshot,
  retentionDays: number,
): Promise<void> {
  const history = await getBalanceHistory(providerId);
  history.snapshots.push(snapshot);

  // Prune old snapshots beyond retention
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  history.snapshots = history.snapshots.filter(s => s.timestamp >= cutoff);

  await chrome.storage.local.set({ [historyKey(providerId)]: history });
}

export async function clearBalanceHistory(providerId: string): Promise<void> {
  await chrome.storage.local.remove(historyKey(providerId));
}

// ============================================================
// Status History (rolling window of recent status checks)
// ============================================================

const STATUS_HISTORY_KEY_PREFIX = 'status_history_';

export interface StatusHistoryEntry {
  timestamp: number;
  isAvailable: boolean;
  statusMessage: string;
}

export interface StatusHistory {
  providerId: string;
  entries: StatusHistoryEntry[];  // newest last
}

const MAX_STATUS_HISTORY = 50;

function statusHistoryKey(providerId: string): string {
  return `${STATUS_HISTORY_KEY_PREFIX}${providerId}`;
}

export async function getStatusHistory(providerId: string): Promise<StatusHistory> {
  const result = await chrome.storage.local.get(statusHistoryKey(providerId));
  return result[statusHistoryKey(providerId)] ?? { providerId, entries: [] };
}

export async function appendStatusHistoryEntry(
  providerId: string,
  entry: StatusHistoryEntry,
): Promise<void> {
  const history = await getStatusHistory(providerId);
  history.entries.push(entry);
  // Keep only last MAX_STATUS_HISTORY entries
  if (history.entries.length > MAX_STATUS_HISTORY) {
    history.entries = history.entries.slice(-MAX_STATUS_HISTORY);
  }
  await chrome.storage.local.set({ [statusHistoryKey(providerId)]: history });
}
