import { getAllProviders } from './provider-registry';
import { getProviderConfigs, getBalanceCache, getStatusCache, getSettings } from './storage';
import type { BalanceHistory } from '@/types';

/** Suppress spend alerts for the first 30 s after SW start to avoid flash on load. */
let startupGraceUntil = Date.now() + 30_000;

export async function updateBadge(): Promise<void> {
  try {
  const providers = getAllProviders();
  const storedConfigs = await getProviderConfigs();
  const balanceCache = await getBalanceCache();
  const statusCache = await getStatusCache();

  const infoParts: string[] = [];
  let hasAlert = false;

  for (const provider of providers) {
    // Resolve effective config — match UI logic (ProviderList/AppLayout):
    //   enabled := config?.enabled !== false  (no config → enabled for popular providers)
    let config = storedConfigs.find(c => c.providerId === provider.id) ?? null;
    if (!config && provider.popular === false) {
      config = { providerId: provider.id, enabled: false, apiKey: '', displayName: '', alertEnabled: false };
    }
    if (config?.enabled === false) continue; // explicitly disabled → skip

    const name = config?.displayName || provider.name;
    const bCache = balanceCache[provider.id];
    const sCache = statusCache[provider.id];

    const status = sCache?.result?.isAvailable ? '✓' : sCache?.result ? '✗' : '?';
    let line = `${name} ${status}`;

    if (bCache?.result?.success && bCache.result.balances.length > 0) {
      const bal = bCache.result.balances[0];
      const amount = bal.totalBalance;
      line += ` ${formatShortBalance(bal.currency, amount)}`;

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

  // Badge: Chrome badges always have an opaque background that covers the icon.
  // RGBA alpha is not supported, so we skip the normal balance badge entirely.
  // Balance info is in the tooltip. Spend alerts (💰/🌕) still use the badge.
  chrome.action.setBadgeText({ text: '' });

  // Tooltip
  const title = infoParts.length > 0
    ? infoParts.join('\n')
    : 'AI Pulse';
  chrome.action.setTitle({ title });

  console.log('Badge updated:', { title, providers: infoParts.length });
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

/** Whether spend alerts should fire right now. Suppressed during startup grace period. */
export function spendAlertsAllowed(): boolean {
  return Date.now() > startupGraceUntil;
}

/** Animate badge with spend-level emoji. Always runs regardless of sound setting. */
export async function showSpendAlert(totalSpend: number, currency: string, level: 'light' | 'heavy', details: { name: string; spend: number }[]): Promise<void> {
  // Suppress alerts during startup grace period to avoid flash on load
  if (!spendAlertsAllowed()) {
    console.log('Spend alert suppressed during startup grace period');
    return;
  }

  const emoji = level === 'heavy' ? '💰' : '🌕';
  const duration = level === 'heavy' ? 3000 : 2000;

  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
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
