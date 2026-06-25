import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllProviders, getProvider, getBuiltinProviders,
  registerCustomProvider, removeCustomProvider, getCustomProviders,
  initCustomProviders,
} from '@/core/provider-registry';
import type { Provider } from '@/types';

describe('provider-registry', () => {
  beforeEach(() => {
    // Clear custom providers from registry
    for (const p of getCustomProviders()) {
      removeCustomProvider(p.id);
    }
  });

  describe('built-in providers', () => {
    it('has at least 11 built-in providers', () => {
      const providers = getAllProviders();
      expect(providers.length).toBeGreaterThanOrEqual(11);
    });

    it('includes DeepSeek', () => {
      const ds = getProvider('deepseek');
      expect(ds).toBeDefined();
      expect(ds!.name).toBe('DeepSeek');
      expect(ds!.capabilities.canFetchBalance).toBe(true);
    });

    it('includes OpenAI', () => {
      const oai = getProvider('openai');
      expect(oai).toBeDefined();
      expect(oai!.capabilities.canFetchStatus).toBe(true);
      expect(oai!.balanceType).toBe('usage');
    });

    it('includes xAI and Perplexity', () => {
      expect(getProvider('xai')).toBeDefined();
      expect(getProvider('perplexity')).toBeDefined();
    });

    it('popular providers are marked', () => {
      const ds = getProvider('deepseek');
      const qwen = getProvider('qwen');
      expect(ds!.popular).not.toBe(false);
      // Non-popular providers exist but may not be default visible
      expect(qwen).toBeDefined();
    });

    it('getBuiltinProviders returns only built-ins', () => {
      const builtins = getBuiltinProviders();
      expect(builtins.length).toBeGreaterThanOrEqual(11);
      // All built-ins should have known IDs
      const ids = builtins.map(p => p.id);
      expect(ids).toContain('deepseek');
      expect(ids).toContain('openai');
    });

    it('getProvider returns undefined for unknown ID', () => {
      expect(getProvider('nonexistent')).toBeUndefined();
    });
  });

  describe('custom providers', () => {
    const customP: Provider = {
      id: 'custom-test',
      name: 'Test Provider',
      company: 'Test Co',
      description: 'A test provider',
      icon: '🔧',
      baseUrl: 'https://example.com',
      capabilities: { canFetchBalance: true, canFetchStatus: true },
      fetchBalance: async () => ({ success: true, balances: [], rawTimestamp: Date.now() }),
      fetchStatus: async () => ({ success: true, isAvailable: true, statusMessage: 'OK', rawTimestamp: Date.now() }),
    };

    it('registers and retrieves custom providers', () => {
      registerCustomProvider(customP);
      expect(getProvider('custom-test')).toBeDefined();
      expect(getCustomProviders()).toHaveLength(1);
      expect(getAllProviders()).toContainEqual(expect.objectContaining({ id: 'custom-test' }));
    });

    it('removes custom providers', () => {
      registerCustomProvider(customP);
      removeCustomProvider('custom-test');
      expect(getProvider('custom-test')).toBeUndefined();
      expect(getCustomProviders()).toHaveLength(0);
    });

    it('does not affect built-ins when adding/removing', () => {
      const before = getBuiltinProviders().length;
      registerCustomProvider(customP);
      expect(getBuiltinProviders()).toHaveLength(before);
      removeCustomProvider('custom-test');
      expect(getBuiltinProviders()).toHaveLength(before);
    });

    it('loads custom providers from storage', async () => {
      (chrome.storage.local.get as any).mockResolvedValueOnce({
        custom_providers: [customP],
      });
      await initCustomProviders();
      expect(getProvider('custom-test')).toBeDefined();
    });
  });
});
