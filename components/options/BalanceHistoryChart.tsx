import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';
import { t } from '@/utils/i18n';

interface BalanceHistoryChartProps {
  providerId: string;
}

const CURRENCY_COLORS: Record<string, string> = {
  CNY: '#22c55e',
  USD: '#3b82f6',
  tokens: '#a855f7',
};

const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ providerId }) => {
  const { chartData, currencies, loading } = useBalanceHistory(providerId);

  if (loading) {
    return (
      <div className="chart-container">
        <p className="chart-loading">{t('chart.loading')}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <p className="chart-empty">{t('chart.empty')}</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h4>{t('chart.title')}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            domain={['auto', 'auto']}
            tickFormatter={(val: number) =>
              val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(2)
            }
          />
          <Tooltip
            contentStyle={{
              background: '#1a2332',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              name === 'CNY' ? `¥${value.toFixed(2)}` : value.toLocaleString(),
              name,
            ]}
          />
          <Legend />
          {currencies.map(currency => (
            <Line
              key={currency}
              type="monotone"
              dataKey={currency}
              stroke={CURRENCY_COLORS[currency] ?? '#94a3b8'}
              strokeWidth={2}
              dot={chartData.length <= 20 ? { r: 3 } : false}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceHistoryChart;
