import { useState, useEffect, useCallback } from 'react';
import type { BalanceHistory } from '@/types';
import { sendMessage } from '@/core/message-bus';
import { getLanguage } from '@/utils/i18n';

interface ChartDataPoint {
  timestamp: number;
  [currency: string]: number | string;
}

export function useBalanceHistory(providerId: string | null) {
  const [history, setHistory] = useState<BalanceHistory | null>(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!providerId) { setHistory(null); return; }
    setLoading(true);
    try {
      const data = await sendMessage<BalanceHistory>('GET_BALANCE_HISTORY', providerId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load balance history:', err);
      setHistory(null);
    } finally { setLoading(false); }
  }, [providerId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    const onVisible = () => loadHistory();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadHistory]);

  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSnapshots = (history?.snapshots ?? []).filter(s => s.timestamp > cutoff);

  // Use numeric timestamps — Recharts handles time spacing naturally
  const chartData: ChartDataPoint[] = recentSnapshots.map(snapshot => {
    const point: ChartDataPoint = { timestamp: snapshot.timestamp };
    for (const balance of snapshot.balances) {
      point[balance.currency] = balance.totalBalance;
    }
    return point;
  });

  const currencies = new Set<string>();
  for (const snapshot of recentSnapshots) {
    for (const balance of snapshot.balances) {
      currencies.add(balance.currency);
    }
  }

  return { history, loading, chartData, currencies: Array.from(currencies), reload: loadHistory };
}

/** Format timestamp for chart axis / tooltip */
export function formatChartTime(ts: number, lang: string): string {
  const d = new Date(ts);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  if (lang === 'zh') return `${month}月${day}日 ${hour}:${min}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${day} ${hour}:${min}`;
}
