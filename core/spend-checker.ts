import { getProviderConfigs, getBalanceCache, getSettings } from './storage';
import type { BalanceCacheEntry, BalanceSnapshot } from '@/types';

interface SpendResult {
  totalSpend: number;
  totalDailyAvg: number;
  currency: string;
  level: 'none' | 'light' | 'heavy';
  details: { name: string; spend: number }[];
}

/** Compare current balances with previous cache to detect spending */
export async function checkSpending(): Promise<SpendResult> {
  const settings = await getSettings();
  const configs = await getProviderConfigs();
  const cache = await getBalanceCache();

  let totalSpend = 0;
  let totalDailyAvg = 0;
  let currency = 'CNY';
  const details: { name: string; spend: number }[] = [];

  for (const [providerId, entry] of Object.entries(cache)) {
    if (!entry?.result?.success || !entry.result.balances.length) continue;
    const config = configs.find(c => c.providerId === providerId);
    if (!config?.enabled || !config.apiKey) continue;

    const bal = entry.result.balances[0];
    currency = bal.currency;

    // Compute daily avg from this provider's history
    const historyKey = `balance_history_${providerId}`;
    const histResult = await chrome.storage.local.get(historyKey);
    const history: { snapshots: BalanceSnapshot[] } = histResult[historyKey];
    if (!history?.snapshots || history.snapshots.length < 2) continue;

    const snapshots = history.snapshots;
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    const firstBal = first.balances.find(b => b.currency === bal.currency);
    const lastBal = last.balances.find(b => b.currency === bal.currency);
    if (!firstBal || !lastBal) continue;

    const providerSpend = firstBal.totalBalance - lastBal.totalBalance;
    if (providerSpend <= 0.01) continue; // negligible

    const days = Math.max(1, (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));
    const dailyAvg = providerSpend / days;

    const name = config.displayName || providerId;

    // Only count spend above daily average (natural consumption)
    const excessSpend = providerSpend - dailyAvg;
    if (excessSpend > 0) {
      totalSpend += providerSpend;
      totalDailyAvg += dailyAvg;
      details.push({ name, spend: providerSpend });
    }
  }

  if (totalSpend <= 0.01 || totalDailyAvg <= 0) {
    return { totalSpend: 0, totalDailyAvg: 0, currency, level: 'none', details: [] };
  }

  const ratio = totalSpend / totalDailyAvg;
  let level: SpendResult['level'] = 'none';
  if (ratio >= 1 && ratio < 3) level = 'light';
  else if (ratio >= 3) level = 'heavy';

  return { totalSpend, totalDailyAvg, currency, level, details };
}
