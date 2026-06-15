import { describe, it, expect } from 'vitest';
import { deepseekProvider } from '@/providers/deepseek';

describe('DeepSeek provider', () => {
  it('has correct metadata', () => {
    expect(deepseekProvider.id).toBe('deepseek');
    expect(deepseekProvider.name).toBe('DeepSeek');
    expect(deepseekProvider.company).toContain('DeepSeek');
    expect(deepseekProvider.capabilities.canFetchBalance).toBe(true);
    expect(deepseekProvider.capabilities.canFetchStatus).toBe(true);
  });

  it('validates API key format', () => {
    expect(deepseekProvider.validateApiKey!('sk-abcdefghijklmnopqrst')).toBe(true);
    expect(deepseekProvider.validateApiKey!('invalid-key')).toBe(false);
    expect(deepseekProvider.validateApiKey!('')).toBe(false);
  });

  it('fetchStatus returns operational when API responds', async () => {
    global.fetch = async () => new Response('{}', { status: 401 });
    const result = await deepseekProvider.fetchStatus!();
    expect(result.success).toBe(true);
    expect(result.isAvailable).toBe(true);
    expect(result.statusMessage).toBe('运行中');
  });

  it('fetchStatus returns unreachable on network error', async () => {
    global.fetch = async () => { throw new Error('Network error'); };
    const result = await deepseekProvider.fetchStatus!();
    expect(result.success).toBe(false);
    expect(result.isAvailable).toBe(false);
    expect(result.statusMessage).toBe('无法访问');
  });

  it('fetchBalance parses balance response correctly', async () => {
    global.fetch = async () => new Response(JSON.stringify({
      is_available: true,
      balance_infos: [{
        currency: 'CNY',
        total_balance: '110.00',
        granted_balance: '10.00',
        topped_up_balance: '100.00',
      }],
    }), { status: 200 });

    const result = await deepseekProvider.fetchBalance!('sk-test');
    expect(result.success).toBe(true);
    expect(result.balances).toHaveLength(1);
    expect(result.balances[0].currency).toBe('CNY');
    expect(result.balances[0].totalBalance).toBe(110);
    expect(result.balances[0].grantedBalance).toBe(10);
    expect(result.balances[0].toppedUpBalance).toBe(100);
  });

  it('fetchBalance handles error response', async () => {
    global.fetch = async () => new Response('Unauthorized', { status: 401 });
    const result = await deepseekProvider.fetchBalance!('sk-invalid');
    expect(result.success).toBe(false);
  });
});
