import type { BalanceEntry } from '@/types';

/**
 * Format a balance entry for display.
 */
export function formatBalance(entry: BalanceEntry): string {
  const amount = entry.totalBalance;

  switch (entry.currency) {
    case 'CNY':
      return `¥${amount.toFixed(2)}`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'tokens':
      return amount >= 1_000_000
        ? `${(amount / 1_000_000).toFixed(1)}M`
        : amount >= 1_000
          ? `${(amount / 1_000).toFixed(1)}K`
          : amount.toString();
    default:
      return `${amount.toFixed(2)} ${entry.currency}`;
  }
}

/**
 * Get a CSS color for a currency type.
 */
export function getCurrencyColor(currency: string): string {
  const colors: Record<string, string> = {
    CNY: '#22c55e',
    USD: '#3b82f6',
    tokens: '#a855f7',
  };
  return colors[currency] ?? '#94a3b8';
}
