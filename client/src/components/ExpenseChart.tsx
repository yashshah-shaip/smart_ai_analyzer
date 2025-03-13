import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for the expense chart
const expenseData = [
  { name: 'Housing', amount: 1800 },
  { name: 'Food', amount: 620 },
  { name: 'Transport', amount: 450 },
  { name: 'Utilities', amount: 280 },
  { name: 'Entertainment', amount: 180 },
  { name: 'Subscriptions', amount: 87 },
];

export default function ExpenseChart() {
  const formatCurrency = (value: number) => {
    return `$${value}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={expenseData}
        margin={{
          top: 5,
          right: 5,
          left: 5,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }} 
          axisLine={false}
          tickLine={false}
          dy={10}
          angle={-45}
          textAnchor="end"
        />
        <YAxis 
          tickFormatter={formatCurrency} 
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <Tooltip 
          formatter={(value) => [`$${value}`, 'Monthly Expense']}
          contentStyle={{ 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }}
        />
        <Bar 
          dataKey="amount" 
          fill="#635BFF" 
          radius={[4, 4, 0, 0]}
          name="Monthly Expenses"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
