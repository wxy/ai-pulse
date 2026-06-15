import { describe, it, expect } from 'vitest';
import { validateDeepSeekKey, validateBearerToken, isNonEmptyKey } from '@/utils/validators';

describe('validators', () => {
  describe('validateDeepSeekKey', () => {
    it('accepts valid sk- keys', () => {
      expect(validateDeepSeekKey('sk-abcdefghijklmnopqrst')).toBe(true);
      expect(validateDeepSeekKey('sk-a1b2c3d4e5f6g7h8i9j0k1l2m3')).toBe(true);
    });

    it('rejects keys without sk- prefix', () => {
      expect(validateDeepSeekKey('abcdefghijklmnopqrst')).toBe(false);
    });

    it('rejects short keys', () => {
      expect(validateDeepSeekKey('sk-short')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(validateDeepSeekKey('')).toBe(false);
    });
  });

  describe('validateBearerToken', () => {
    it('accepts long alphanumeric tokens', () => {
      expect(validateBearerToken('abcdefghijklmnopqrst')).toBe(true);
    });

    it('accepts tokens with dots, dashes, and underscores', () => {
      expect(validateBearerToken('abc.def-ghi_jkl.mno-extra-chars')).toBe(true);
    });

    it('rejects short tokens', () => {
      expect(validateBearerToken('short')).toBe(false);
    });
  });

  describe('isNonEmptyKey', () => {
    it('returns true for non-empty strings', () => {
      expect(isNonEmptyKey('hello')).toBe(true);
    });

    it('returns false for empty or whitespace-only strings', () => {
      expect(isNonEmptyKey('')).toBe(false);
      expect(isNonEmptyKey('   ')).toBe(false);
    });
  });
});
