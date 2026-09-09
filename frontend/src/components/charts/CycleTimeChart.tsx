import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CycleTimeChartProps {
  data: any;
}

export const CycleTimeChart: React.FC<CycleTimeChartProps> = ({ data }) => {
  const rows: any[] = Array.isArray(data) ? data : data?.rows || [];

  // Aggregate by month (e.g., "2024-05")
  const monthMap: Record<string, { totalDays: number; count: number }> = {};
  rows.forEach((r) => {
    let key = r.period;
    if (!key && r.po_created_at) {
      key = r.po_created_at.substring(0, 7);
    }
    if (!key) key = 'Recent';
    if (!monthMap[key]) monthMap[key] = { totalDays: 0, count: 0 };
    monthMap[key].totalDays += Number(r.total_cycle_days || r.avg_cycle_days || 0);
    monthMap[key].count += Number(r.po_count || 1);
  });

  const chartData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([period, stats]) => ({
      period,
      days: stats.count > 0 ? Number((stats.totalDays / stats.count).toFixed(1)) : 0,
      count: stats.count,
    }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-vppt-ash/60 border border-dashed border-vppt-border rounded-lg bg-vppt-surface/20">
        <p className="text-xs">No cycle time data recorded.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C6A15B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C6A15B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2926" vertical={false} />
          <XAxis dataKey="period" stroke="#B8B5AC" fontSize={11} tickLine={false} />
          <YAxis stroke="#B8B5AC" fontSize={11} tickLine={false} unit="d" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#17171B',
              borderColor: '#8F7440',
              borderRadius: '6px',
              color: '#E7E2D5',
              fontSize: '12px',
            }}
            formatter={(value: any, _: any, item: any) => {
              const count = item?.payload?.count ?? 0;
              return [
                `${value ?? 0} days (${count} orders)`,
                'Avg Cycle Time',
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="days"
            stroke="#C6A15B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#goldGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
