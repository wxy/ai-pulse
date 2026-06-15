import { getAllProviders } from './provider-registry';
import { getProviderConfigs, getBalanceCache, getStatusCache, getSettings } from './storage';

let cycleTimer: ReturnType<typeof setInterval> | null = null;
let cycleIndex = 0;

export async function updateBadge(): Promise<void> {
  const settings = await getSettings();
  const providers = getAllProviders();
  const configs = await getProviderConfigs();
  const balanceCache = await getBalanceCache();
  const statusCache = await getStatusCache();

  const activeBalances: { name: string; currency: string; amount: number }[] = [];
  const infoParts: string[] = [];

  for (const provider of providers) {
    const config = configs.find(c => c.providerId === provider.id);
    const name = config?.displayName || provider.name;
    const bCache = balanceCache[provider.id];
    const sCache = statusCache[provider.id];

    // Build single-line status + balance per provider
    const status = sCache?.result?.isAvailable ? '✓' : sCache?.result ? '✗' : '?';
    let line = `${name} ${status}`;

    if (bCache?.result?.success && bCache.result.balances.length > 0) {
      const bal = bCache.result.balances[0];
      line += ` ${formatShortBalance(bal.currency, bal.totalBalance)}`;
      activeBalances.push({ name, currency: bal.currency, amount: bal.totalBalance });
    }

    infoParts.push(line);
  }

  // Badge text: only show balance (cycle if multiple)
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

  // Tooltip: each provider on its own line
  const title = infoParts.length > 0
    ? infoParts.join('\n')
    : 'AI Pulse';
  chrome.action.setTitle({ title });

  // Balance threshold alert: turn badge red if any balance below threshold
  if (settings.balanceThreshold > 0 && activeBalances.length > 0) {
    const belowThreshold = activeBalances.some(b => {
      // Normalize to CNY equivalent (rough approximation)
      const amount = b.currency === 'CNY' ? b.amount : b.currency === 'USD' ? b.amount * 7.2 : b.amount;
      return amount < settings.balanceThreshold;
    });
    if (belowThreshold) {
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    }
  }
}

function formatShortBalance(currency: string, amount: number): string {
  if (currency === 'CNY') return `¥${amount.toFixed(2)}`;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(Math.round(amount));
}

function badgeText(currency: string, amount: number): string {
  if (currency === 'CNY') {
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toFixed(0);
  }
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  if (amount >= 100) return amount.toFixed(0);
  return amount.toFixed(0);
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
  if (cycleTimer) {
    clearInterval(cycleTimer);
    cycleTimer = null;
  }
}
