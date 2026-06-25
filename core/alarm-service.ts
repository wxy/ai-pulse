import { getSettings } from './storage';
import { getProviderConfigs } from './storage';
import { getAllProviders } from './provider-registry';
import { fetchAndCacheBalance } from './balance-service';
import { fetchAndCacheStatus } from './status-service';
import { updateBadge, showSpendAlert } from './badge-service';
import { checkSpending } from './spend-checker';

const ALARM_NAME = 'fetch-balance-status';
let lastInterval = 0;

export async function startPeriodicFetch(): Promise<void> {
  const settings = await getSettings();
  const interval = settings.refreshIntervalMinutes;

  // Only recreate alarm if interval changed or first run
  if (interval !== lastInterval) {
    await chrome.alarms.clear(ALARM_NAME);
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: interval,
    });
    lastInterval = interval;
    console.log(`Scheduled periodic fetch every ${interval} minutes`);
  } else {
    // Alarm already exists with correct interval — just check if it exists
    const existing = await chrome.alarms.get(ALARM_NAME);
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: interval,
      });
      console.log(`Re-created periodic fetch alarm every ${interval} minutes`);
    }
  }

  // Only run immediate fetch if no recent data (avoid fetching on every SW wake)
  const statusCache = await import('./storage').then(m => m.getStatusCache());
  const cacheEntries = Object.values(statusCache);
  if (cacheEntries.length === 0) {
    // First ever run — fetch immediately
    runFetchCycle();
  } else {
    const oldestFetch = Math.min(...cacheEntries.map(e => e.lastFetchTimestamp || 0));
    const halfInterval = interval * 60 * 1000 / 2;
    if (Date.now() - oldestFetch > halfInterval) {
      // Data is stale — fetch
      runFetchCycle();
    } else {
      console.log('Recent data exists, skipping immediate fetch');
    }
  }
}

export async function runFetchCycle(): Promise<void> {
  console.log('Running fetch cycle...');
  const configs = await getProviderConfigs();
  const providers = getAllProviders();

  const tasks: Promise<void>[] = [];

  for (const provider of providers) {
    const config = configs.find(c => c.providerId === provider.id);
    // Skip disabled providers entirely
    if (config && !config.enabled) continue;

    // Fetch status
    if (provider.capabilities.canFetchStatus) {
      tasks.push(
        fetchAndCacheStatus(provider).then(() =>
          console.log(`Status fetched for ${provider.id}`)
        ).catch(err =>
          console.error(`Status fetch failed for ${provider.id}:`, err)
        )
      );
    }

    // Fetch balance if API key is configured
    if (provider.capabilities.canFetchBalance && config?.apiKey) {
      tasks.push(
        fetchAndCacheBalance(provider, config.apiKey).then(() =>
          console.log(`Balance fetched for ${provider.id}`)
        ).catch(err =>
          console.error(`Balance fetch failed for ${provider.id}:`, err)
        )
      );
    }
  }

  await Promise.allSettled(tasks);
  console.log('Fetch cycle complete');

  // Update extension badge
  await updateBadge();

  // Check spending and alert if needed
  const spend = await checkSpending();
  if (spend.level !== 'none') {
    showSpendAlert(spend.totalSpend, spend.currency, spend.level, spend.details);
  }
}

export function setupAlarmListener(): void {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await runFetchCycle();
    }
  });
}
