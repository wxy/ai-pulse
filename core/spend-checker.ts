import { getProviderConfigs, getBalanceCache, getBalanceDelta } from './storage';
import { getProvider } from './provider-registry';

interface SpendResult {
  totalSpend: number;
  totalDailyAvg: number;
  currency: string;
  level: 'none' | 'light' | 'heavy';
  details: { name: string; spend: number }[];
}

interface CurrencyAgg {
  totalSpend: number;
  totalDailyAvg: number;
  details: { name: string; spend: number }[];
}

function levelForRatio(ratio: number): SpendResult['level'] {
  if (ratio >= 3) return 'heavy';
  if (ratio >= 1) return 'light';
  return 'none';
}

function levelPriority(level: SpendResult['level']): number {
  return level === 'heavy' ? 2 : level === 'light' ? 1 : 0;
}

/** Compare current balances with previous cache to detect spending */
export async function checkSpending(): Promise<SpendResult> {
  const configs = await getProviderConfigs();
  const cache = await getBalanceCache();

  const byCurrency = new Map<string, CurrencyAgg>();

  for (const [providerId, entry] of Object.entries(cache)) {
    if (!entry?.result?.success || !entry.result.balances.length) continue;
    const config = configs.find(c => c.providerId === providerId);
    if (!config?.enabled || !config.apiKey) continue;

    const bal = entry.result.balances[0];
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

    // Only count spend above natural daily consumption
    if (providerSpend <= dailyAvg) continue;

    let agg = byCurrency.get(bal.currency);
    if (!agg) {
      agg = { totalSpend: 0, totalDailyAvg: 0, details: [] };
      byCurrency.set(bal.currency, agg);
    }
    agg.totalSpend += providerSpend;
    agg.totalDailyAvg += dailyAvg;
    agg.details.push({ name: config.displayName || providerId, spend: providerSpend });
  }

  // Aggregate per currency — never mix different currencies in one total.
  // If multiple currencies trigger alerts, report the most severe one.
  let best: SpendResult | null = null;
  for (const [currency, agg] of byCurrency) {
    if (agg.totalSpend <= 0.01 || agg.totalDailyAvg <= 0) continue;

    const level = levelForRatio(agg.totalSpend / agg.totalDailyAvg);
    if (level === 'none') continue;

    if (!best || levelPriority(level) > levelPriority(best.level)) {
      best = {
        totalSpend: agg.totalSpend,
        totalDailyAvg: agg.totalDailyAvg,
        currency,
        level,
        details: agg.details,
      };
    }
  }

  return best ?? { totalSpend: 0, totalDailyAvg: 0, currency: 'CNY', level: 'none', details: [] };
}
