import { t } from '@/utils/i18n';
import type { StatusResult } from '@/types';

export type StatusKind = 'ok' | 'warning' | 'down';

/**
 * Classify an HTTP status into the three-state model:
 * - 2xx/3xx  → ok（运行中）
 * - 401/403  → warning（服务可达，但健康检查未通过鉴权）
 * - 404      → warning（服务可达，但检查接口路径有问题）
 * - 其他 4xx → warning（服务可达）
 * - 5xx      → down（服务异常）
 */
export function classifyHttpStatus(status: number): { kind: StatusKind; message: string } {
  if (status >= 200 && status < 400) return { kind: 'ok', message: t('status.running') };
  if (status === 401 || status === 403) return { kind: 'warning', message: t('status.needs_auth') };
  if (status === 404) return { kind: 'warning', message: t('status.endpoint_error') };
  if (status >= 500) return { kind: 'down', message: `${t('status.error')} (HTTP ${status})` };
  return { kind: 'warning', message: `${t('status.reachable')} (HTTP ${status})` };
}

/** Build a StatusResult from a fetch response. */
export function statusFromResponse(res: Response): StatusResult {
  const { kind, message } = classifyHttpStatus(res.status);
  return {
    success: kind !== 'down',
    isAvailable: kind !== 'down',
    statusKind: kind,
    source: 'api',
    statusMessage: message,
    rawTimestamp: Date.now(),
  };
}

/** Build a StatusResult from a network failure. */
export function statusFromError(err: unknown): StatusResult {
  return {
    success: false,
    isAvailable: false,
    statusKind: 'down',
    source: 'api',
    statusMessage: t('status.unreachable'),
    rawTimestamp: Date.now(),
    error: err instanceof Error ? err.message : 'Unknown error',
  };
}

const KIND_PRIORITY: Record<StatusKind, number> = { ok: 0, warning: 1, down: 2 };

/** Merge two status signals, keeping the more severe one. */
export function mergeStatusKinds(a: StatusKind, b: StatusKind | null | undefined): StatusKind {
  if (!b) return a;
  return KIND_PRIORITY[b] > KIND_PRIORITY[a] ? b : a;
}
