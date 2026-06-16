import { defineBackground } from 'wxt/utils/define-background';
import { loadLanguage } from '@/utils/i18n';
import { getAllProviders, initCustomProviders } from '@/core/provider-registry';
import {
  getSettings,
  setSettings,
  getProviderConfigs,
  setProviderConfig,
  deleteProviderConfig,
  getBalanceCache,
  getStatusCache,
  getBalanceHistory,
  getStatusHistory,
} from '@/core/storage';
import { fetchAndCacheBalance } from '@/core/balance-service';
import { fetchAndCacheStatus } from '@/core/status-service';
import { registerMessageHandler, startMessageListener } from '@/core/message-bus';
import {
  startPeriodicFetch,
  setupAlarmListener,
} from '@/core/alarm-service';
import { updateBadge } from '@/core/badge-service';
import type {
  GlobalSettings,
  ProviderConfig,
  ProviderSummary,
  BalanceHistory,
} from '@/types';

// ============================================================
// Default Settings Initialization
// ============================================================

async function initializeDefaults(): Promise<void> {
  const { settings } = await chrome.storage.local.get('settings');
  if (!settings) {
    await chrome.storage.local.set({
      settings: {
        refreshIntervalMinutes: 60,
        theme: 'dark',
        historyRetentionDays: 90,
      },
    });
    console.log('Default settings initialized');
  }
}

// ============================================================
// Build Provider Summary for Popup
// ============================================================

async function buildProviderSummaries(): Promise<ProviderSummary[]> {
  const providers = getAllProviders();
  const configs = await getProviderConfigs();
  const balanceCache = await getBalanceCache();
  const statusCache = await getStatusCache();

  const summaries: ProviderSummary[] = [];

  for (const provider of providers) {
    const config = configs.find(c => c.providerId === provider.id) ?? null;

    // Include ALL providers — popup will filter display as needed
    const bCache = balanceCache[provider.id] ?? null;
    const sCache = statusCache[provider.id] ?? null;

    // Compute trend from last two balance snapshots
    let trend: ProviderSummary['trend'] = 'unknown';
    if (bCache?.result?.success && bCache.result.balances.length > 0) {
      trend = 'flat';
    }

    summaries.push({ provider, config, balanceCache: bCache, statusCache: sCache, trend });
  }

  return summaries;
}

// ============================================================
// Message Handler
// ============================================================

let _initResolve: (() => void) | null = null;
const _initPromise = new Promise<void>(r => { _initResolve = r; });

async function handleMessage(action: string, payload: unknown): Promise<unknown> {
  await _initPromise; // Wait for background to finish initializing
  switch (action) {
    case 'GET_PROVIDER_STATE':
      return buildProviderSummaries();

    case 'FETCH_BALANCE': {
      const providers = getAllProviders();
      const configs = await getProviderConfigs();
      const results: Record<string, unknown> = {};

      for (const provider of providers) {
        if (!provider.capabilities.canFetchBalance) continue;
        const config = configs.find(c => c.providerId === provider.id);
        if (!config?.enabled || !config.apiKey) continue;
        const entry = await fetchAndCacheBalance(provider, config.apiKey);
        results[provider.id] = entry;
      }
      updateBadge();
      return results;
    }

    case 'FETCH_STATUS': {
      const providers = getAllProviders();
      const results: Record<string, unknown> = {};

      for (const provider of providers) {
        if (!provider.capabilities.canFetchStatus) continue;
        const entry = await fetchAndCacheStatus(provider);
        results[provider.id] = entry;
      }
      updateBadge();
      return results;
    }

    case 'UPDATE_PROVIDER_CONFIG': {
      const config = payload as ProviderConfig;
      await setProviderConfig(config);

      // If API key was provided, immediately fetch balance to validate
      if (config.enabled && config.apiKey) {
        const provider = getAllProviders().find(p => p.id === config.providerId);
        if (provider?.capabilities.canFetchBalance) {
          await fetchAndCacheBalance(provider, config.apiKey);
        }
      }
      return { success: true };
    }

    case 'DELETE_PROVIDER_CONFIG': {
      const providerId = payload as string;
      await deleteProviderConfig(providerId);
      return { success: true };
    }

    case 'UPDATE_SETTINGS': {
      const settings = payload as GlobalSettings;
      await setSettings(settings);
      // Restart alarm with new interval
      await startPeriodicFetch();
      return { success: true };
    }

    case 'GET_BALANCE_HISTORY': {
      const providerId = payload as string;
      return getBalanceHistory(providerId);
    }

    case 'GET_STATUS_HISTORY': {
      const providerId = payload as string;
      return getStatusHistory(providerId);
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// ============================================================
// Background Entry Point
// ============================================================

export default defineBackground(async () => {
  console.log('AI Pulse background service worker started');

  // Load language preference and custom providers
  await loadLanguage();
  await initCustomProviders();

  // Initialize default settings
  chrome.runtime.onInstalled.addListener(async () => {
    await initializeDefaults();
    // Start periodic fetching after install
    await startPeriodicFetch();
  });

  // Set up alarm listener
  setupAlarmListener();

  // Set up message handler for popup/options communication
  registerMessageHandler(handleMessage);
  startMessageListener();

  // Start periodic fetch on startup (in case SW was terminated)
  await startPeriodicFetch();

  // Mark as initialized so message handler can process requests
  _initResolve!();
});
