import type { Provider, StatusCacheEntry, StatusResult } from '@/types';
import { setStatusCacheEntry, appendStatusHistoryEntry } from './storage';
import { mergeStatusKinds, type StatusKind } from './status-classifier';
import { t } from '@/utils/i18n';

interface StatusPageState {
  kind: StatusKind;
  description: string;
}

/**
 * Fetch the provider's public status page (statuspage.io JSON API format).
 * Returns null when the feed is unavailable — the API check alone remains valid.
 */
async function fetchStatusPageState(url: string): Promise<StatusPageState | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const indicator = json?.status?.indicator as string | undefined;
    if (!indicator || indicator === 'none') return { kind: 'ok', description: '' };

    const kind: StatusKind = indicator === 'major' || indicator === 'critical' ? 'down' : 'warning';
    return { kind, description: typeof json?.status?.description === 'string' ? json.status.description : '' };
  } catch {
    return null; // Status page is best-effort — never fail the check because of it
  }
}

function mergeApiAndPage(api: StatusResult, page: StatusPageState | null): StatusResult {
  if (!page) return api;

  const kind = mergeStatusKinds(api.statusKind, page.kind);
  if (kind === api.statusKind) {
    return { ...api, source: 'merged' };
  }

  return {
    ...api,
    success: kind !== 'down',
    isAvailable: kind !== 'down',
    statusKind: kind,
    source: 'merged',
    statusMessage: page.description ? `${api.statusMessage} · ${page.description}` : api.statusMessage,
  };
}

export async function fetchAndCacheStatus(provider: Provider, apiKey?: string): Promise<StatusCacheEntry> {
  const hasStatusPage = Boolean(provider.statusPageApiUrl);
  if (!provider.fetchStatus && !hasStatusPage) {
    return {
      providerId: provider.id,
      lastFetchTimestamp: Date.now(),
      lastSuccessTimestamp: 0,
      result: null,
    };
  }

  let result: StatusResult;
  try {
    const page = hasStatusPage ? await fetchStatusPageState(provider.statusPageApiUrl!) : null;

    // Without a user API key, an unauthenticated probe would only ever report
    // 401/403 — that is not a real signal. If the provider has a public status
    // page, trust it as the authoritative source and skip the fake-key probe.
    // When the status page is unavailable, fall back to the API probe.
    const shouldProbeApi = !hasStatusPage || Boolean(apiKey) || page === null;
    const apiResult = provider.fetchStatus && shouldProbeApi ? await provider.fetchStatus(apiKey) : null;

    if (!apiResult) {
      result = {
        success: page ? page.kind !== 'down' : false,
        isAvailable: page ? page.kind !== 'down' : false,
        statusKind: page?.kind ?? 'down',
        source: page ? 'page' : 'api',
        statusMessage: page?.description
          || (page?.kind === 'ok' ? t('status.running') : page?.kind === 'warning' ? t('status.warning') : t('status.unreachable')),
        rawTimestamp: Date.now(),
      };
    } else {
      result = mergeApiAndPage(apiResult, page);
    }
  } catch (err) {
    result = {
      success: false,
      isAvailable: false,
      statusKind: 'down',
      source: 'api',
      statusMessage: err instanceof Error ? err.message : 'Unknown error',
      rawTimestamp: Date.now(),
    };
  }

  const entry: StatusCacheEntry = {
    providerId: provider.id,
    lastFetchTimestamp: Date.now(),
    lastSuccessTimestamp: result.success ? Date.now() : 0,
    result,
  };

  await setStatusCacheEntry(entry);

  // Append to status history
  if (result) {
    await appendStatusHistoryEntry(provider.id, {
      timestamp: Date.now(),
      isAvailable: result.isAvailable,
      statusKind: result.statusKind,
      source: result.source,
      statusMessage: result.statusMessage,
    });
  }

  return entry;
}
