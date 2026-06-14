import { t } from '@/utils/i18n';
import { useState, useEffect, useCallback } from 'react';
import type { ProviderSummary } from '@/types';
import { sendMessage } from '@/core/message-bus';

export function useProviders() {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sendMessage<ProviderSummary[]>('GET_PROVIDER_STATE');
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.load_providers'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const refreshBalance = useCallback(async () => {
    try {
      setLoading(true);
      await sendMessage('FETCH_BALANCE');
      // Reload full state after fetching
      const data = await sendMessage<ProviderSummary[]>('GET_PROVIDER_STATE');
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.refresh_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      await sendMessage('FETCH_STATUS');
      const data = await sendMessage<ProviderSummary[]>('GET_PROVIDER_STATE');
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.refresh_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        sendMessage('FETCH_BALANCE'),
        sendMessage('FETCH_STATUS'),
      ]);
      const data = await sendMessage<ProviderSummary[]>('GET_PROVIDER_STATE');
      setProviders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error.refresh_failed'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { providers, loading, error, refreshBalance, refreshStatus, refreshAll };
}
