import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TenantWithSubscription {
  id: string;
  name: string;
  is_blocked: boolean;
  plan_id: string | null;
  plan_name: string | null;
  status: string | null;
  end_date: string | null;
  subscription_id: string | null;
}

interface TenantsTableProps {
  tenants: TenantWithSubscription[];
  loading: boolean;
  onEdit: (tenant: TenantWithSubscription) => void;
}

const getStatusBadge = (status: string | null, isBlocked: boolean) => {
  if (isBlocked) {
    return <Badge variant="destructive">Bloqueado</Badge>;
  }
  
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Ativo</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inativo</Badge>;
    case 'expired':
      return <Badge variant="outline" className="border-amber-500 text-amber-500">Expirado</Badge>;
    case 'trial':
      return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Trial</Badge>;
    default:
      return <Badge variant="outline">Sem assinatura</Badge>;
  }
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
};

const isExpiringSoon = (dateStr: string | null) => {
  if (!dateStr) return false;
  const endDate = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays > 0;
};

const isExpired = (dateStr: string | null) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

export function TenantsTable({ tenants, loading, onEdit }: TenantsTableProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Empresa/Pessoa</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plano</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-3 px-4 font-medium text-foreground">
                {tenant.name}
              </td>
              <td className="py-3 px-4 text-muted-foreground">
                {tenant.plan_name || 'Sem plano'}
              </td>
              <td className="py-3 px-4">
                <span className={
                  isExpired(tenant.end_date) 
                    ? 'text-destructive font-medium' 
                    : isExpiringSoon(tenant.end_date) 
                      ? 'text-amber-500 font-medium' 
                      : 'text-muted-foreground'
                }>
                  {formatDate(tenant.end_date)}
                  {isExpired(tenant.end_date) && ' (Vencido)'}
                  {isExpiringSoon(tenant.end_date) && ' (Vence em breve)'}
                </span>
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(tenant.status, tenant.is_blocked)}
              </td>
              <td className="py-3 px-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(tenant)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
