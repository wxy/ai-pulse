import { useState, useEffect, useCallback } from 'react';
import type { BalanceHistory, BalanceSnapshot } from '@/types';
import { sendMessage } from '@/core/message-bus';

interface ChartDataPoint {
  timestamp: number;
  date: string;
  [currency: string]: number | string;
}

export function useBalanceHistory(providerId: string | null) {
  const [history, setHistory] = useState<BalanceHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!providerId) {
      setHistory(null);
      return;
    }
    setLoading(true);
    try {
      const data = await sendMessage<BalanceHistory>('GET_BALANCE_HISTORY', providerId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load balance history:', err);
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Convert history snapshots to chart-friendly format
  const chartData: ChartDataPoint[] = (history?.snapshots ?? []).map(snapshot => {
    const point: ChartDataPoint = {
      timestamp: snapshot.timestamp,
      date: new Date(snapshot.timestamp).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    for (const balance of snapshot.balances) {
      point[balance.currency] = balance.totalBalance;
    }
    return point;
  });

  // Get unique currencies across all snapshots
  const currencies = new Set<string>();
  for (const snapshot of history?.snapshots ?? []) {
    for (const balance of snapshot.balances) {
      currencies.add(balance.currency);
    }
  }

  return { history, loading, chartData, currencies: Array.from(currencies), reload: loadHistory };
}
