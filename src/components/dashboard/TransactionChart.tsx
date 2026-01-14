import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface TransactionChartProps {
  data: {
    date: string;
    income: number;
    expense: number;
  }[];
}

export function TransactionChart({ data }: TransactionChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: 'short' 
      }),
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  return (
    <div className="stat-card h-[400px]">
      <h3 className="font-display font-semibold text-lg mb-6">
        Fluxo de Caixa
      </h3>
      
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={formatCurrency}
          />
          
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'income' ? 'Receitas' : 'Despesas'
            ]}
          />
          
          <Legend 
            formatter={(value) => value === 'income' ? 'Receitas' : 'Despesas'}
          />
          
          <Area
            type="monotone"
            dataKey="income"
            stroke="hsl(160, 84%, 39%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#incomeGradient)"
          />
          
          <Area
            type="monotone"
            dataKey="expense"
            stroke="hsl(0, 84%, 60%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#expenseGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
