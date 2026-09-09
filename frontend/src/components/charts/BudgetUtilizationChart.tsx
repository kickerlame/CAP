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
import { BudgetUtilization } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BudgetUtilizationChartProps {
  data: BudgetUtilization[];
}

export const BudgetUtilizationChart: React.FC<BudgetUtilizationChartProps> = ({ data }) => {
  const chartData = data.map((b) => ({
    name: b.dept_name,
    budget: Number(b.total_amount),
    spent: Number(b.spent_amount),
    remaining: Number(b.remaining_amount),
    utilization: Number(b.utilization_pct),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2926" vertical={false} />
          <XAxis dataKey="name" stroke="#B8B5AC" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#B8B5AC"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `RM ${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#17171B',
              borderColor: '#8F7440',
              borderRadius: '6px',
              color: '#E7E2D5',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any, item: any) => {
              if (name === 'Spent') {
                return [`${formatCurrency(value)} (${item.payload.utilization}%)`, 'Spent'];
              }
              return [formatCurrency(value), name];
            }}
          />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }} />
          <Bar dataKey="spent" name="Spent" fill="#C6A15B" radius={[3, 3, 0, 0]} />
          <Bar dataKey="remaining" name="Remaining" fill="#2A2926" stroke="#34332F" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
