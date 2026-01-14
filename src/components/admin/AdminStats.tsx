import { Users, Building2, ArrowDownUp } from 'lucide-react';

interface AdminStatsProps {
  totalUsers: number;
  totalTenants: number;
  totalTransactions: number;
}

export function AdminStats({ totalUsers, totalTenants, totalTransactions }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="stat-card">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-primary/10">
            <Users className="text-primary" size={28} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Usuários</p>
            <p className="text-3xl font-display font-bold text-foreground">{totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-primary/10">
            <Building2 className="text-primary" size={28} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Tenants</p>
            <p className="text-3xl font-display font-bold text-foreground">{totalTenants}</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-primary/10">
            <ArrowDownUp className="text-primary" size={28} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Transações</p>
            <p className="text-3xl font-display font-bold text-foreground">{totalTransactions}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
