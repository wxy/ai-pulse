import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProviderCard from '@/components/popup/ProviderCard';
import type { ProviderSummary } from '@/types';
import { deepseekProvider } from '@/providers/deepseek';

const baseSummary: ProviderSummary = {
  provider: deepseekProvider,
  config: null,
  balanceCache: null,
  statusCache: null,
  trend: 'unknown',
};

describe('ProviderCard', () => {
  beforeEach(() => {
    (chrome.storage.local.set as any).mockClear();
    (chrome.runtime.openOptionsPage as any).mockClear();
  });

  it('renders provider name', () => {
    render(<ProviderCard summary={baseSummary} />);
    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<ProviderCard summary={baseSummary} />);
    expect(screen.getByText('深度求索 DeepSeek')).toBeInTheDocument();
  });

  it('renders add API key prompt when no key configured', () => {
    render(<ProviderCard summary={baseSummary} />);
    expect(screen.getByText(/API Key/)).toBeInTheDocument();
  });

  it('renders status indicator', () => {
    render(<ProviderCard summary={baseSummary} />);
    expect(screen.getByText('未知')).toBeInTheDocument();
  });

  it('renders with custom display name', () => {
    const summary = {
      ...baseSummary,
      config: { providerId: 'deepseek', enabled: true, apiKey: '', displayName: '我的 DeepSeek', alertEnabled: false },
    };
    render(<ProviderCard summary={summary} />);
    expect(screen.getByText('我的 DeepSeek')).toBeInTheDocument();
  });

  it('renders balance when data is available', () => {
    const summary: ProviderSummary = {
      ...baseSummary,
      config: { providerId: 'deepseek', enabled: true, apiKey: 'sk-test', displayName: '', alertEnabled: true },
      balanceCache: {
        providerId: 'deepseek',
        lastFetchTimestamp: Date.now(),
        lastSuccessTimestamp: Date.now(),
        result: {
          success: true,
          balances: [{ currency: 'CNY', totalBalance: 100, grantedBalance: 0, toppedUpBalance: 0 }],
          rawTimestamp: Date.now(),
        },
      },
    };
    render(<ProviderCard summary={summary} />);
    expect(screen.getByText('¥100.00')).toBeInTheDocument();
  });
});
