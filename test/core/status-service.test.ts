import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchAndCacheStatus } from '@/core/status-service';
import { statusFromResponse } from '@/core/status-classifier';
import type { Provider } from '@/types';

function makeProvider(statusPageApiUrl?: string, fetchStatusImpl?: Provider['fetchStatus']): Provider {
  return {
    id: 'test-provider',
    name: 'Test',
    company: 'Test',
    description: 'Test',
    icon: '🔧',
    baseUrl: 'https://example.com',
    capabilities: { canFetchBalance: false, canFetchStatus: true },
    fetchStatus: fetchStatusImpl ?? (async () => statusFromResponse(new Response('', { status: 200 }))),
    ...(statusPageApiUrl ? { statusPageApiUrl } : {}),
  };
}

function statusPageResponse(indicator: string, description = ''): Response {
  return new Response(JSON.stringify({ status: { indicator, description } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('status-service', () => {
  beforeEach(async () => {
    await chrome.storage.local.set({ status_cache: {} });
  });

  it('uses the API probe when no status page is configured', async () => {
    const probe = vi.fn(async () => statusFromResponse(new Response('', { status: 200 })));
    const entry = await fetchAndCacheStatus(makeProvider(undefined, probe));
    expect(entry.result?.statusKind).toBe('ok');
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it('skips the unauthenticated probe and trusts the status page without a key', async () => {
    const probe = vi.fn(async () => statusFromResponse(new Response('', { status: 401 })));
    global.fetch = async () => statusPageResponse('none');

    const entry = await fetchAndCacheStatus(makeProvider('https://status.example.com/api/v2/status.json', probe));
    expect(entry.result?.statusKind).toBe('ok');
    expect(entry.result?.source).toBe('page');
    expect(probe).not.toHaveBeenCalled();
  });

  it('escalates to down when the status page reports a major incident without a key', async () => {
    const probe = vi.fn(async () => statusFromResponse(new Response('', { status: 200 })));
    global.fetch = async () => statusPageResponse('major', 'Major outage');

    const entry = await fetchAndCacheStatus(makeProvider('https://status.example.com/api/v2/status.json', probe));
    expect(entry.result?.statusKind).toBe('down');
    expect(entry.result?.isAvailable).toBe(false);
    expect(entry.result?.statusMessage).toContain('Major outage');
    expect(entry.result?.source).toBe('page');
    expect(probe).not.toHaveBeenCalled();
  });

  it('falls back to the API probe when the status page is unavailable', async () => {
    const probe = vi.fn(async () => statusFromResponse(new Response('', { status: 200 })));
    global.fetch = async () => new Response('nope', { status: 404 });

    const entry = await fetchAndCacheStatus(makeProvider('https://status.example.com/api/v2/status.json', probe));
    expect(entry.result?.statusKind).toBe('ok');
    expect(entry.result?.source).toBe('api');
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it('runs the authenticated probe and merges with the status page when a key exists', async () => {
    const probe = vi.fn(async () => statusFromResponse(new Response('', { status: 200 })));
    global.fetch = async () => statusPageResponse('minor', 'Degraded performance');

    const entry = await fetchAndCacheStatus(
      makeProvider('https://status.example.com/api/v2/status.json', probe),
      'sk-test-key',
    );
    expect(probe).toHaveBeenCalledWith('sk-test-key');
    // API ok + status page minor → warning
    expect(entry.result?.statusKind).toBe('warning');
    expect(entry.result?.statusMessage).toContain('Degraded performance');
    expect(entry.result?.source).toBe('merged');
  });
});
