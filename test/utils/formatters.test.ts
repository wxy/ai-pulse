import { describe, it, expect } from 'vitest';
import { timeAgo, formatDate } from '@/utils/formatters';

describe('formatters', () => {
  describe('timeAgo', () => {
    it('returns 从未更新 for 0 timestamp', () => {
      expect(timeAgo(0)).toBe('从未更新');
    });

    it('returns 刚刚 for recent timestamps', () => {
      const now = Date.now();
      expect(timeAgo(now - 30_000)).toBe('刚刚');
    });

    it('returns minutes for timestamps under 1 hour', () => {
      const now = Date.now();
      expect(timeAgo(now - 5 * 60_000)).toContain('分钟前');
    });

    it('returns hours for timestamps under 1 day', () => {
      const now = Date.now();
      expect(timeAgo(now - 3 * 3600_000)).toContain('小时前');
    });

    it('returns days for older timestamps', () => {
      const now = Date.now();
      expect(timeAgo(now - 2 * 86400_000)).toContain('天前');
    });
  });

  describe('formatDate', () => {
    it('returns a date string', () => {
      const result = formatDate(Date.now());
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
