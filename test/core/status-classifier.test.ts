import { describe, it, expect } from 'vitest';
import { classifyHttpStatus, mergeStatusKinds, statusFromResponse, statusFromError } from '@/core/status-classifier';

describe('status-classifier', () => {
  it('classifies 2xx as ok', () => {
    expect(classifyHttpStatus(200).kind).toBe('ok');
    expect(classifyHttpStatus(204).kind).toBe('ok');
  });

  it('classifies 401/403 as warning with auth message', () => {
    expect(classifyHttpStatus(401)).toMatchObject({ kind: 'warning', message: expect.stringContaining('鉴权') });
    expect(classifyHttpStatus(403)).toMatchObject({ kind: 'warning', message: expect.stringContaining('鉴权') });
  });

  it('classifies 404 as warning with endpoint message', () => {
    expect(classifyHttpStatus(404)).toMatchObject({ kind: 'warning', message: expect.stringContaining('接口') });
  });

  it('classifies 5xx as down', () => {
    expect(classifyHttpStatus(500).kind).toBe('down');
    expect(classifyHttpStatus(503).kind).toBe('down');
  });

  it('builds results from responses and errors', () => {
    const ok = statusFromResponse(new Response('', { status: 200 }));
    expect(ok.statusKind).toBe('ok');
    expect(ok.isAvailable).toBe(true);

    const bad = statusFromError(new Error('network'));
    expect(bad.statusKind).toBe('down');
    expect(bad.isAvailable).toBe(false);
  });

  it('merges status kinds keeping the more severe one', () => {
    expect(mergeStatusKinds('ok', 'warning')).toBe('warning');
    expect(mergeStatusKinds('warning', 'down')).toBe('down');
    expect(mergeStatusKinds('down', 'ok')).toBe('down');
    expect(mergeStatusKinds('ok', null)).toBe('ok');
  });
});
