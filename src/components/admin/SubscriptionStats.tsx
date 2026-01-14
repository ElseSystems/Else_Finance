interface SubscriptionStatsProps {
  mrr: number;
  arr: number;
  churnRate: number;
  activeSubscriptions: number;
}

export function SubscriptionStats({ mrr, arr, churnRate, activeSubscriptions }: SubscriptionStatsProps) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stat-card">
        <p className="text-sm text-muted-foreground">MRR</p>
        <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(mrr)}</p>
      </div>
      <div className="stat-card">
        <p className="text-sm text-muted-foreground">ARR</p>
        <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(arr)}</p>
      </div>
      <div className="stat-card">
        <p className="text-sm text-muted-foreground">Churn</p>
        <p className="text-2xl font-display font-bold text-foreground">{churnRate.toFixed(1)}%</p>
      </div>
      <div className="stat-card">
        <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
        <p className="text-2xl font-display font-bold text-foreground">{activeSubscriptions}</p>
      </div>
    </div>
  );
}

