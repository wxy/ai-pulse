import { getSettings } from './storage';
import { getProviderConfigs } from './storage';
import { getLastCycleAt, setLastCycleAt } from './storage';
import { getAllProviders } from './provider-registry';
import { fetchAndCacheBalance } from './balance-service';
import { fetchAndCacheStatus } from './status-service';
import { updateBadge, showSpendAlert } from './badge-service';
import { checkSpending } from './spend-checker';

const ALARM_NAME = 'fetch-balance-status';
const FETCH_CONCURRENCY = 3;
let lastInterval = 0;

/** Run async tasks with a bounded concurrency limit. */
export async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

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

  // Only run an immediate fetch when a full cycle hasn't run within the interval.
  // Do NOT scan per-provider cache entries: disabled providers keep old entries
  // forever, which previously made every SW wake look "stale" and fetch again.
  const lastCycle = await getLastCycleAt();
  const intervalMs = interval * 60 * 1000;
  if (lastCycle === 0) {
    // First ever run — fetch immediately
    console.log('First run — fetching immediately');
    await runFetchCycle();
  } else if (Date.now() - lastCycle > intervalMs) {
    // Alarm hasn't fired recently (e.g., SW was asleep) — catch up once
    console.log('Last cycle is older than the refresh interval — fetching');
    await runFetchCycle();
  } else {
    console.log(`Recent cycle exists (${Math.round((Date.now() - lastCycle) / 60000)} min ago), skipping immediate fetch`);
  }
}

export async function runFetchCycle(): Promise<void> {
  console.log('Running fetch cycle...');
  const configs = await getProviderConfigs();
  const providers = getAllProviders();

  const tasks: (() => Promise<void>)[] = [];

  for (const provider of providers) {
    // Resolve effective config — match UI logic (ProviderList/AppLayout):
    //   enabled := config?.enabled !== false  (no config → enabled for popular providers)
    let config = configs.find(c => c.providerId === provider.id) ?? null;
    if (!config && provider.popular === false) {
      config = { providerId: provider.id, enabled: false, apiKey: '', displayName: '', alertEnabled: false };
    }
    if (config?.enabled === false) continue; // explicitly disabled → skip

    // Fetch status
    if (provider.capabilities.canFetchStatus) {
      tasks.push(async () => {
        try {
          await fetchAndCacheStatus(provider, config?.apiKey || undefined);
          console.log(`Status fetched for ${provider.id}`);
        } catch (err) {
          console.error(`Status fetch failed for ${provider.id}:`, err);
        }
      });
    }

    // Fetch balance if API key is configured
    if (provider.capabilities.canFetchBalance && config?.apiKey) {
      tasks.push(async () => {
        try {
          const entry = await fetchAndCacheBalance(provider, config.apiKey);
          if (entry.result?.success) {
            console.log(`Balance fetched for ${provider.id}`);
          } else {
            console.error(`Balance fetch failed for ${provider.id}:`, entry.result?.error);
          }
        } catch (err) {
          console.error(`Balance fetch failed for ${provider.id}:`, err);
        }
      });
    }
  }

  // Bound concurrency to avoid bursting ~17 requests at once (rate limits, SW load)
  await runWithConcurrency(tasks, FETCH_CONCURRENCY);
  await setLastCycleAt(Date.now());
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
