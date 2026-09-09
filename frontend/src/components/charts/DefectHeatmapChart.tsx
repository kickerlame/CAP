import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { DefectHeatmapItem } from '../../types';

interface DefectHeatmapChartProps {
  data: DefectHeatmapItem[];
}

export const DefectHeatmapChart: React.FC<DefectHeatmapChartProps> = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  const chartData = rows.slice(0, 10).map((d) => {
    const rawRate = d.defect_rate_pct ?? d.avg_defect_rate ?? 0;
    const rawInspections = d.inspection_count ?? d.total_inspections ?? 0;
    const defectRate = isNaN(Number(rawRate)) ? 0 : Number(Number(rawRate).toFixed(1));
    const inspections = isNaN(Number(rawInspections)) ? 0 : Number(rawInspections);
    const vendorName = d.vendor_name || 'Vendor';
    const categoryName = d.category_name || 'Category';

    return {
      name: `${vendorName} - ${categoryName}`,
      vendor: vendorName,
      category: categoryName,
      defectRate,
      inspections,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center text-vppt-ash/60 border border-dashed border-vppt-border rounded-lg bg-vppt-surface/20">
        <p className="text-xs">No defect inspection records available.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2926" horizontal={false} />
          <XAxis type="number" stroke="#B8B5AC" fontSize={11} tickLine={false} unit="%" />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#B8B5AC"
            fontSize={10}
            tickLine={false}
            width={130}
            tickFormatter={(val: string) => (val && val.length > 20 ? `${val.substring(0, 20)}...` : val || '')}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#17171B',
              borderColor: '#8F7440',
              borderRadius: '6px',
              color: '#E7E2D5',
              fontSize: '12px',
            }}
            formatter={(value: any, _: any, item: any) => {
              const inspections = item?.payload?.inspections ?? 0;
              return [
                `${value ?? 0}% defect rate (${inspections} inspections)`,
                'Quality Defect Rate',
              ];
            }}
          />
          <ReferenceLine
            x={5}
            stroke="#9B4D4D"
            strokeDasharray="3 3"
            label={{ value: '5% SLA threshold', fill: '#9B4D4D', fontSize: 10, position: 'top' }}
          />
          <Bar
            dataKey="defectRate"
            fill="#B08A4A"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
