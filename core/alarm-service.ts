import { getSettings } from './storage';
import { getProviderConfigs } from './storage';
import { getAllProviders } from './provider-registry';
import { fetchAndCacheBalance } from './balance-service';
import { fetchAndCacheStatus } from './status-service';
import { updateBadge } from './badge-service';

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

  // Run an initial fetch if no recent data
  runFetchCycle();
}

export async function runFetchCycle(): Promise<void> {
  console.log('Running fetch cycle...');
  const configs = await getProviderConfigs();
  const providers = getAllProviders();

  const tasks: Promise<void>[] = [];

  for (const provider of providers) {
    // Always fetch status regardless of config
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
    const config = configs.find(c => c.providerId === provider.id);
    if (provider.capabilities.canFetchBalance && config?.enabled && config.apiKey) {
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
  updateBadge();
}

export function setupAlarmListener(): void {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await runFetchCycle();
    }
  });
}
