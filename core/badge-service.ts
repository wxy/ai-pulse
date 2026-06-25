import { getAllProviders } from './provider-registry';
import { getProviderConfigs, getBalanceCache, getStatusCache, getSettings } from './storage';
import type { BalanceHistory } from '@/types';

let cycleTimer: ReturnType<typeof setInterval> | null = null;
let cycleIndex = 0;

export async function updateBadge(): Promise<void> {
  try {
  const providers = getAllProviders();
  const configs = await getProviderConfigs();
  const balanceCache = await getBalanceCache();
  const statusCache = await getStatusCache();

  const activeBalances: { name: string; currency: string; amount: number }[] = [];
  const infoParts: string[] = [];
  let hasAlert = false;

  for (const provider of providers) {
    const config = configs.find(c => c.providerId === provider.id);
    // Skip disabled providers
    if (config && !config.enabled) continue;
    const name = config?.displayName || provider.name;
    const bCache = balanceCache[provider.id];
    const sCache = statusCache[provider.id];

    const status = sCache?.result?.isAvailable ? '✓' : sCache?.result ? '✗' : '?';
    let line = `${name} ${status}`;

    if (bCache?.result?.success && bCache.result.balances.length > 0) {
      const bal = bCache.result.balances[0];
      const amount = bal.totalBalance;
      line += ` ${formatShortBalance(bal.currency, amount)}`;
      activeBalances.push({ name, currency: bal.currency, amount });

      // Per-provider alert: adapt to billing model
      if (config?.alertEnabled && amount > 0) {
        try {
          const { rate: dailyRate } = await getDailyAvg(provider.id, bal.currency);
          const bType = provider.balanceType ?? 'prepaid';
          if (dailyRate > 0) {
            const shouldAlert = bType === 'usage'
              ? amount > dailyRate * 7   // usage: cumulative spend > 7 days of avg? overspending!
              : amount < dailyRate;       // prepaid/quota: remaining < 1 day? running low!
            if (shouldAlert) { hasAlert = true; line += ' ⚠'; }
          }
        } catch { /* ignore — alert check is best-effort */ }
      }
    }

    infoParts.push(line);
  }

  // Badge text
  if (activeBalances.length > 0) {
    if (activeBalances.length > 1) {
      startCycling(activeBalances);
    } else {
      stopCycling();
      const b = activeBalances[0];
      chrome.action.setBadgeText({ text: badgeText(b.currency, b.amount) });
    }
  } else {
    stopCycling();
    chrome.action.setBadgeText({ text: '' });
  }

  // Badge background: only set for alerts, use Chrome default otherwise
  if (hasAlert) {
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  }

  // Tooltip
  const title = infoParts.length > 0
    ? infoParts.join('\n')
    : 'AI Pulse';
  chrome.action.setTitle({ title });

  console.log('Badge updated:', { text: activeBalances.length > 0 ? badgeText(activeBalances[0].currency, activeBalances[0].amount) : 'empty', title, providers: infoParts.length });
  } catch (err) {
    console.error('updateBadge failed:', err);
  }
}

/** Compute daily avg consumption (absolute value) from balance history */
async function getDailyAvg(providerId: string, currency: string): Promise<{ rate: number; direction: 'up' | 'down' | 'flat' }> {
  const key = `balance_history_${providerId}`;
  const result = await chrome.storage.local.get(key);
  const history: BalanceHistory = result[key];
  if (!history?.snapshots || history.snapshots.length < 2) return { rate: 0, direction: 'flat' };

  const snapshots = history.snapshots;
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  const firstBal = first.balances.find(b => b.currency === currency);
  const lastBal = last.balances.find(b => b.currency === currency);
  if (!firstBal || !lastBal) return { rate: 0, direction: 'flat' };

  const diff = firstBal.totalBalance - lastBal.totalBalance;
  const abs = Math.abs(diff);
  if (abs < 0.001) return { rate: 0, direction: 'flat' };

  const daysDiff = Math.max(1, (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24));
  return { rate: abs / daysDiff, direction: diff > 0 ? 'down' : 'up' };
}

function formatShortBalance(currency: string, amount: number): string {
  if (currency === 'CNY') return `¥${amount.toFixed(2)}`;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(Math.round(amount));
}

/** Format number to ≤4 chars for Chrome badge. integer→K→M→B */
function badgeShort(n: number): string {
  if (n < 1000) return String(Math.round(n));        // 0–999    (1–3)
  const k = Math.round(n / 1000);
  if (k < 1000) return k + 'K';                       // 1K–999K  (2–4)
  const m = Math.round(n / 1e6);
  if (m < 1000) return m + 'M';                       // 1M–999M  (2–4)
  return Math.round(n / 1e9) + 'B';                   // 1B+      (2–4)
}

function badgeText(currency: string, amount: number): string {
  return badgeShort(amount);
}

function startCycling(balances: { name: string; currency: string; amount: number }[]): void {
  stopCycling();
  cycleIndex = 0;
  const show = () => {
    const b = balances[cycleIndex % balances.length];
    chrome.action.setBadgeText({ text: badgeText(b.currency, b.amount) });
    cycleIndex++;
  };
  show();
  cycleTimer = setInterval(show, 4000);
}

function stopCycling(): void {
  if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
}

/** Animate badge with spend-level emoji. Always runs regardless of sound setting. */
export async function showSpendAlert(totalSpend: number, currency: string, level: 'light' | 'heavy', details: { name: string; spend: number }[]): Promise<void> {
  // Badge animation: show single emoji matching spend level
  const emoji = level === 'heavy' ? '💰' : '🌕';
  const duration = level === 'heavy' ? 3000 : 2000;

  chrome.action.setBadgeText({ text: emoji });
  setTimeout(() => updateBadge(), duration);

  // Sound/notification controlled by setting
  const settings = await getSettings();
  if (settings.soundEnabled === false) return;

  if (chrome.notifications) {
    const prefix = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : '';
    const providerList = details.map(d => `${d.name}: ${prefix}${d.spend.toFixed(2)}`).join('\n');
    chrome.notifications.create('spend-alert', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: level === 'heavy' ? '💸 Heavy spending' : '🌕 Spending alert',
      message: `Total ${prefix}${totalSpend.toFixed(2)}\n${providerList}`,
      priority: 1,
    });
  }
}
