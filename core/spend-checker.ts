import { getProviderConfigs, getBalanceCache, getSettings, getBalanceDelta } from './storage';
import { getProvider } from './provider-registry';

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

    const delta = await getBalanceDelta(providerId, bal.currency);
    if (!delta) continue;

    // Adapt spend direction to billing model
    // - 'usage': cumulative usage (increases over time), spend = increase in balance
    // - 'prepaid': prepaid balance (decreases over time), spend = decrease in balance
    const bType = getProvider(providerId)?.balanceType ?? 'prepaid';
    const providerSpend = bType === 'usage'
      ? delta.lastBalance - delta.firstBalance   // usage grows, spend is increase
      : delta.firstBalance - delta.lastBalance;   // prepaid decreases, spend is decrease
    if (providerSpend <= 0.01) continue; // negligible

    const dailyAvg = providerSpend / delta.daysDiff;

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
