import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startPeriodicFetch, runWithConcurrency } from '@/core/alarm-service';

describe('alarm-service fetch cadence', () => {
  beforeEach(async () => {
    await chrome.storage.local.set({
      settings: { refreshIntervalMinutes: 60, historyRetentionDays: 90, soundEnabled: true },
      provider_configs: [],
      last_cycle_at: Date.now(),
    });
    global.fetch = vi.fn(async () => new Response('{}', { status: 200 }));
  });

  it('skips the immediate fetch when a full cycle ran recently', async () => {
    await startPeriodicFetch();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches immediately when the last full cycle is older than the interval', async () => {
    await chrome.storage.local.set({ last_cycle_at: Date.now() - 61 * 60 * 1000 });
    await startPeriodicFetch();
    expect(global.fetch).toHaveBeenCalled();
  });

  it('fetches immediately on first run', async () => {
    await chrome.storage.local.set({ last_cycle_at: 0 });
    await startPeriodicFetch();
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('runWithConcurrency', () => {
  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const tasks = Array.from({ length: 8 }, () => async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      inFlight -= 1;
    });

    await runWithConcurrency(tasks, 3);
    expect(maxInFlight).toBeLessThanOrEqual(3);
  });

  it('resolves all results in order', async () => {
    const tasks = [1, 2, 3, 4].map(n => async () => n * 2);
    const results = await runWithConcurrency(tasks, 2);
    expect(results).toEqual([2, 4, 6, 8]);
  });
});
