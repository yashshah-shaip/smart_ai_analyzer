import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PortfolioAllocation } from '@shared/schema';

interface PortfolioChartProps {
  data: PortfolioAllocation | null | undefined;
}

export default function PortfolioChart({ data }: PortfolioChartProps) {
  // Default data if none is provided
  const chartData = data ? [
    { name: 'Stocks', value: data.stocks },
    { name: 'Bonds', value: data.bonds },
    { name: 'Real Estate', value: data.realEstate },
    { name: 'Cash', value: data.cash },
    { name: 'Alternatives', value: data.alternatives },
  ] : [
    { name: 'Stocks', value: 45 },
    { name: 'Bonds', value: 25 },
    { name: 'Real Estate', value: 15 },
    { name: 'Cash', value: 10 },
    { name: 'Alternatives', value: 5 },
  ];

  const COLORS = ['#635BFF', '#00D4FF', '#1A1F36', '#36B37E', '#FFAB00'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Allocation']}
          contentStyle={{ 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: 'none' 
          }}
        />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          iconSize={10}
          iconType="circle"
          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
