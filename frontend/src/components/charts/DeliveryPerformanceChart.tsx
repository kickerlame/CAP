import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DeliveryPerformanceChartProps {
  data: any;
}

export const DeliveryPerformanceChart: React.FC<DeliveryPerformanceChartProps> = ({ data }) => {
  const rows: any[] = Array.isArray(data) ? data : data?.rows || [];

  // Group deliveries by vendor name
  const vendorMap: Record<string, { onTime: number; late: number }> = {};
  rows.forEach((r) => {
    const vName = r.vendor_name || 'Vendor';
    if (!vendorMap[vName]) vendorMap[vName] = { onTime: 0, late: 0 };
    if (r.is_on_time === 1 || r.is_on_time === true || r.on_time) {
      vendorMap[vName].onTime += Number(r.on_time || 1);
    } else {
      vendorMap[vName].late += Number(r.late || 1);
    }
  });

  const chartData = Object.entries(vendorMap).slice(0, 8).map(([vendorName, stats]) => {
    const total = stats.onTime + stats.late;
    const rate = total > 0 ? Math.round((stats.onTime / total) * 100) : 0;
    return {
      name: vendorName.length > 14 ? `${vendorName.substring(0, 14)}...` : vendorName,
      fullName: vendorName,
      onTime: stats.onTime,
      late: stats.late,
      rate,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-vppt-ash/60 border border-dashed border-vppt-border rounded-lg bg-vppt-surface/20">
        <p className="text-xs">No delivery performance data recorded.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2926" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#B8B5AC"
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis stroke="#B8B5AC" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#17171B',
              borderColor: '#8F7440',
              borderRadius: '6px',
              color: '#E7E2D5',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any, item: any) => {
              const rate = item?.payload?.rate ?? 0;
              if (name === 'On-Time') return [`${value ?? 0} shipments (${rate}%)`, 'On-Time'];
              return [`${value ?? 0} shipments`, 'Late'];
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', textTransform: 'uppercase' }}
          />
          <Bar dataKey="onTime" name="On-Time" fill="#6F8F72" radius={[3, 3, 0, 0]} stackId="a" />
          <Bar dataKey="late" name="Late" fill="#9B4D4D" radius={[3, 3, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
