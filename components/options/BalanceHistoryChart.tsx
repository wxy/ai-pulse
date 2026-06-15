import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBalanceHistory, formatChartTime } from '@/hooks/useBalanceHistory';
import { getLanguage } from '@/utils/i18n';
import { t } from '@/utils/i18n';

interface BalanceHistoryChartProps { providerId: string; }

const CURRENCY_COLORS: Record<string, string> = {
  CNY: '#22c55e', USD: '#3b82f6', tokens: '#a855f7',
};

const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ providerId }) => {
  const { chartData, currencies, loading } = useBalanceHistory(providerId);
  const lang = getLanguage();

  if (loading) {
    return <div className="chart-container"><p className="chart-loading">{t('chart.loading')}</p></div>;
  }

  if (chartData.length === 0) {
    return <div className="chart-container"><p className="chart-empty">{t('chart.empty')}</p></div>;
  }

  return (
    <div className="chart-container">
      <h4>{t('chart.title')}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="none" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            tickFormatter={(ts: number) => {
              const d = new Date(ts);
              const m = d.getMonth() + 1;
              const day = d.getDate();
              return lang === 'zh' ? `${m}/${day}` : `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
            }}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            width={50}
            domain={['auto', 'auto']}
            tickFormatter={(val: number) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(2)}
          />
          <Tooltip
            labelFormatter={(ts: number) => formatChartTime(ts, lang)}
            contentStyle={{ background: '#1a2332', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }}
            // @ts-ignore
            formatter={(value: any, name: string) => (name === 'CNY' ? `¥${(value as number).toFixed(2)}` : String(value))}
          />
          <Legend />
          {currencies.map(currency => (
            <Line key={currency} type="monotone" dataKey={currency}
              stroke={CURRENCY_COLORS[currency] ?? '#94a3b8'}
              strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceHistoryChart;
