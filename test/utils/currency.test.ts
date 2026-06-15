import { describe, it, expect } from 'vitest';
import { formatBalance, getCurrencyColor } from '@/utils/currency';

describe('currency', () => {
  describe('formatBalance', () => {
    it('formats CNY with ¥ symbol', () => {
      const entry = { currency: 'CNY', totalBalance: 100.5, grantedBalance: 0, toppedUpBalance: 0 };
      expect(formatBalance(entry)).toBe('¥100.50');
    });

    it('formats USD with $ symbol', () => {
      const entry = { currency: 'USD', totalBalance: 50.25, grantedBalance: 0, toppedUpBalance: 0 };
      expect(formatBalance(entry)).toBe('$50.25');
    });

    it('formats large token values with K/M suffixes', () => {
      expect(formatBalance({ currency: 'tokens', totalBalance: 1_500_000, grantedBalance: 0, toppedUpBalance: 0 })).toBe('1.5M');
      expect(formatBalance({ currency: 'tokens', totalBalance: 5_000, grantedBalance: 0, toppedUpBalance: 0 })).toBe('5.0K');
      expect(formatBalance({ currency: 'tokens', totalBalance: 500, grantedBalance: 0, toppedUpBalance: 0 })).toBe('500');
    });
  });

  describe('getCurrencyColor', () => {
    it('returns green for CNY', () => {
      expect(getCurrencyColor('CNY')).toBe('#22c55e');
    });

    it('returns blue for USD', () => {
      expect(getCurrencyColor('USD')).toBe('#3b82f6');
    });

    it('returns purple for tokens', () => {
      expect(getCurrencyColor('tokens')).toBe('#a855f7');
    });

    it('returns default for unknown currency', () => {
      expect(getCurrencyColor('EUR')).toBe('#94a3b8');
    });
  });
});
