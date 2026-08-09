import { describe, it, expect, beforeEach } from 'vitest';
import { checkSpending } from '@/core/spend-checker';

const DAY = 24 * 60 * 60 * 1000;

interface SeedProvider {
  providerId: string;
  currency: string;
  firstBalance: number;
  lastBalance: number;
  displayName?: string;
  balanceType?: 'prepaid' | 'usage' | 'quota';
  daysDiff?: number;
}

async function seedProviders(providers: SeedProvider[]): Promise<void> {
  const now = Date.now();
  const seed: Record<string, unknown> = {
    settings: { refreshIntervalMinutes: 60, historyRetentionDays: 90, soundEnabled: true },
    provider_configs: providers.map(p => ({
      providerId: p.providerId,
      enabled: true,
      apiKey: 'sk-test',
      displayName: p.displayName ?? '',
      alertEnabled: false,
    })),
    balance_cache: {},
  };
  for (const p of providers) {
    (seed.balance_cache as Record<string, unknown>)[p.providerId] = {
      providerId: p.providerId,
      lastFetchTimestamp: now,
      lastSuccessTimestamp: now,
      result: { success: true, balances: [{ currency: p.currency, totalBalance: p.lastBalance }], rawTimestamp: now },
    };
    seed[`balance_history_${p.providerId}`] = {
      providerId: p.providerId,
      snapshots: [
        { timestamp: now - (p.daysDiff ?? 2) * DAY, balances: [{ currency: p.currency, totalBalance: p.firstBalance }] },
        { timestamp: now, balances: [{ currency: p.currency, totalBalance: p.lastBalance }] },
      ],
    };
  }
  await chrome.storage.local.set(seed);
}

describe('spend-checker', () => {
  beforeEach(async () => {
    await chrome.storage.local.set({ provider_configs: [], balance_cache: {} });
  });

  it('returns level none when no balance data', async () => {
    const result = await checkSpending();
    expect(result.level).toBe('none');
    expect(result.totalSpend).toBe(0);
  });

  it('returns level none with less than 2 snapshots', async () => {
    const now = Date.now();
    await chrome.storage.local.set({
      settings: { refreshIntervalMinutes: 60, historyRetentionDays: 90, soundEnabled: true },
      provider_configs: [{ providerId: 'deepseek', enabled: true, apiKey: 'sk-test', displayName: '', alertEnabled: false }],
      balance_cache: { deepseek: { providerId: 'deepseek', lastFetchTimestamp: now, lastSuccessTimestamp: now, result: { success: true, balances: [{ currency: 'CNY', totalBalance: 50 }], rawTimestamp: now } } },
      balance_history_deepseek: { providerId: 'deepseek', snapshots: [{ timestamp: now, balances: [{ currency: 'CNY', totalBalance: 50 }] }] },
    });
    const result = await checkSpending();
    expect(result.level).toBe('none');
  });

  it('detects prepaid spending (balance decreases)', async () => {
    await seedProviders([
      { providerId: 'deepseek', currency: 'CNY', firstBalance: 100, lastBalance: 40 },
    ]);
    const result = await checkSpending();
    expect(result.level).toBe('light');
    expect(result.currency).toBe('CNY');
    expect(result.totalSpend).toBe(60);
    expect(result.totalDailyAvg).toBe(30);
    expect(result.details).toEqual([{ name: 'deepseek', spend: 60 }]);
  });

  it('detects usage spend (cumulative usage increases)', async () => {
    await seedProviders([
      { providerId: 'openai', currency: 'USD', firstBalance: 100, lastBalance: 160 },
    ]);
    const result = await checkSpending();
    expect(result.level).toBe('light');
    expect(result.currency).toBe('USD');
    expect(result.totalSpend).toBe(60);
    expect(result.details).toEqual([{ name: 'openai', spend: 60 }]);
  });

  it('does not mix currencies when aggregating', async () => {
    await seedProviders([
      { providerId: 'deepseek', currency: 'CNY', firstBalance: 100, lastBalance: 40 },
      { providerId: 'openai', currency: 'USD', firstBalance: 100, lastBalance: 160 },
    ]);
    const result = await checkSpending();
    // Both trigger 'light'. CNY is aggregated first, so it wins the tie-break.
    // Totals must be per-currency, never 60 + 60 = 120 across mixed currencies.
    expect(result.currency).toBe('CNY');
    expect(result.totalSpend).toBe(60);
    expect(result.details).toHaveLength(1);
  });

  it('returns heavy for spend far above daily average', async () => {
    await seedProviders([
      { providerId: 'deepseek', currency: 'CNY', firstBalance: 1000, lastBalance: 100, daysDiff: 4 },
    ]);
    const result = await checkSpending();
    // Spend 900 over 4 days → dailyAvg 225 → ratio 4 → heavy.
    expect(result.level).toBe('heavy');
  });
});
