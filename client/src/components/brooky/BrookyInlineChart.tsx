import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BrookyChartSpec } from '../../types/cricket';

interface BrookyInlineChartProps {
  spec: BrookyChartSpec;
  isDark?: boolean;
}

export const BrookyInlineChart: React.FC<BrookyInlineChartProps> = ({ spec, isDark = false }) => {
  const hasSecondary = spec.data.some((d) => 'average' in d && Number(d.average) > 0) && spec.dataKey === 'runs';

  return (
    <div
      className={`mt-2.5 rounded-xl p-3 border ${
        isDark ? 'bg-[#0B1424] border-[#1E3557] text-white' : 'bg-[#F3F5F9] border-[#E1E7F0] text-[#102B50]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[11px] font-bold tracking-tight">{spec.title}</p>
          {spec.subtitle && <p className="text-[10px] opacity-65">{spec.subtitle}</p>}
        </div>
      </div>

      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={spec.data} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E3557' : '#DCE4F0'} vertical={false} />
            <XAxis
              dataKey={spec.nameKey}
              tick={{ fontSize: 10, fill: isDark ? '#9EB2CC' : '#4B607F' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isDark ? '#9EB2CC' : '#4B607F' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#102B50',
                border: '1px solid #D7193F',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '11px',
                padding: '6px 10px',
              }}
              itemStyle={{ color: '#FFFFFF' }}
            />
            <Bar dataKey={spec.dataKey} fill="#102B50" radius={[6, 6, 0, 0]} maxBarSize={32} />
            {hasSecondary && spec.type === 'comparison' && (
              <Bar dataKey="average" fill="#D7193F" radius={[6, 6, 0, 0]} maxBarSize={24} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
