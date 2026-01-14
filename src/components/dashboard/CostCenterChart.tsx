import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CostCenterData {
  name: string;
  value: number;
  color: string;
}

interface CostCenterChartProps {
  data: CostCenterData[];
}

export function CostCenterChart({ data }: CostCenterChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const total = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="stat-card h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Sem dados para exibir</p>
      </div>
    );
  }

  return (
    <div className="stat-card h-[350px]">
      <h3 className="font-display font-semibold text-lg mb-4">
        Despesas por Centro de Custo
      </h3>
      
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Valor']}
          />
          
          <Legend 
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value, entry: any) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="text-center mt-2">
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="font-display font-bold text-xl text-foreground">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}
