import { describe, it, expect } from 'vitest';
import { xaiProvider } from '@/providers/xai';
import { perplexityProvider } from '@/providers/perplexity';
import { moonshotProvider } from '@/providers/moonshot';
import { zhipuProvider } from '@/providers/zhipu';

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
    expect(result.statusKind).toBe('warning');
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
    expect(result.statusKind).toBe('warning');
  });

  it('fetchStatus marks 5xx as down', async () => {
    global.fetch = async () => new Response('{}', { status: 503 });
    const result = await perplexityProvider.fetchStatus!();
    expect(result.success).toBe(false);
    expect(result.isAvailable).toBe(false);
    expect(result.statusKind).toBe('down');
  });
});

describe('key-aware status probes', () => {
  it.each([
    ['moonshot', moonshotProvider],
    ['zhipu', zhipuProvider],
  ])('%s sends the configured API key on the status probe', async (_name, provider) => {
    let capturedHeaders: Record<string, string> | undefined;
    global.fetch = async (_url: unknown, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return new Response('{}', { status: 200 });
    };

    const result = await provider.fetchStatus!('sk-real-key');
    expect(capturedHeaders?.Authorization).toBe('Bearer sk-real-key');
    expect(result.statusKind).toBe('ok');
  });
});
