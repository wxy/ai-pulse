import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage, getLanguage, detectLanguage, loadLanguage } from '@/utils/i18n';

describe('i18n', () => {
  beforeEach(() => {
    // Reset to default
    setLanguage('zh');
  });

  describe('t()', () => {
    it('returns Chinese translation when language is zh', () => {
      setLanguage('zh');
      expect(t('status.running')).toBe('运行中');
    });

    it('returns English translation when language is en', () => {
      setLanguage('en');
      expect(t('status.running')).toBe('Operational');
    });

    it('returns the key itself when translation is missing', () => {
      expect(t('nonexistent.key.abc')).toBe('nonexistent.key.abc');
    });

    it('covers all common keys', () => {
      // Keys where ZH != EN
      const keys = [
        'popup.no_key', 'popup.empty',
        'status.running', 'status.error', 'status.unreachable',
        'nav.providers', 'nav.settings', 'nav.about',
        'providers.title', 'providers.back',
        'settings.title', 'settings.theme', 'settings.language',
        'config.display_name', 'config.api_key',
        'chart.title', 'chart.empty',
        'error.page', 'error.refresh_failed',
      ];
      for (const key of keys) {
        setLanguage('zh');
        const zh = t(key);
        setLanguage('en');
        const en = t(key);
        expect(zh).not.toBe(key);
        expect(en).not.toBe(key);
        expect(zh).not.toBe(en);
      }
    });
  });

  describe('setLanguage / getLanguage', () => {
    it('sets and gets language correctly', () => {
      setLanguage('en');
      expect(getLanguage()).toBe('en');
      setLanguage('zh');
      expect(getLanguage()).toBe('zh');
    });
  });

  describe('loadLanguage', () => {
    it('loads from chrome.storage when available', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({ language: 'en' });
      await loadLanguage();
      expect(getLanguage()).toBe('en');
    });

    it('defaults to detected language when storage is empty', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({});
      await loadLanguage();
      const lang = getLanguage();
      expect(['zh', 'en']).toContain(lang);
    });
  });
});
