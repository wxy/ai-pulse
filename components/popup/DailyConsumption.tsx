import React from 'react';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';

interface DailyConsumptionProps {
  providerId: string;
}

const DailyConsumption: React.FC<DailyConsumptionProps> = ({ providerId }) => {
  const { chartData } = useBalanceHistory(providerId);

  if (chartData.length < 2) return null;

  // Calculate daily average consumption from the history
  const snapshots = chartData;
  const firstTs = snapshots[0].timestamp;
  const lastTs = snapshots[snapshots.length - 1].timestamp;
  const daysDiff = Math.max(1, (lastTs - firstTs) / (1000 * 60 * 60 * 24));

  // Find CNY data
  const firstCNY = snapshots[0]['CNY'] as number | undefined;
  const lastCNY = snapshots[snapshots.length - 1]['CNY'] as number | undefined;

  if (typeof firstCNY !== 'number' || typeof lastCNY !== 'number') return null;

  const consumed = firstCNY - lastCNY;
  if (consumed <= 0) return null;

  const dailyAvg = consumed / daysDiff;

  return (
    <span className="daily-consumption" title={`${daysDiff.toFixed(0)} 天共消费 ¥${consumed.toFixed(2)}`}>
      日均 ¥{dailyAvg.toFixed(2)}
    </span>
  );
};

export default DailyConsumption;
