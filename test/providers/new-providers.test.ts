import { describe, it, expect } from 'vitest';
import { xaiProvider } from '@/providers/xai';
import { perplexityProvider } from '@/providers/perplexity';

describe('xAI / Grok provider', () => {
  it('has correct metadata', () => {
    expect(xaiProvider.id).toBe('xai');
    expect(xaiProvider.name).toBe('Grok');
    expect(xaiProvider.company).toBe('xAI');
    expect(xaiProvider.capabilities.canFetchStatus).toBe(true);
  });

  it('fetchStatus returns operational on API response', async () => {
    global.fetch = async () => new Response('{}', { status: 400 });
    const result = await xaiProvider.fetchStatus!();
    expect(result.success).toBe(true);
    expect(result.isAvailable).toBe(true);
  });
});

describe('Perplexity provider', () => {
  it('has correct metadata', () => {
    expect(perplexityProvider.id).toBe('perplexity');
    expect(perplexityProvider.name).toBe('Perplexity');
    expect(perplexityProvider.company).toBe('Perplexity AI');
    expect(perplexityProvider.capabilities.canFetchStatus).toBe(true);
  });

  it('fetchStatus returns operational on API response', async () => {
    global.fetch = async () => new Response('{}', { status: 401 });
    const result = await perplexityProvider.fetchStatus!();
    expect(result.success).toBe(true);
    expect(result.isAvailable).toBe(true);
  });
});
