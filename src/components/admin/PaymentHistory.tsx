import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveTable } from './ResponsiveTable';
import { MobileCard } from './MobileCard';

export interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  mercadopago_payment_id?: string | null;
  invoice_url?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  subscription?: {
    tenant_id?: string;
    tenant?: { name: string };
    plan?: { name: string };
  } | null;
}

interface PaymentHistoryProps {
  payments: PaymentRecord[];
}

const statusColor: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-500',
  pending: 'bg-yellow-500/10 text-yellow-500',
  failed: 'bg-red-500/10 text-red-500',
  refunded: 'bg-blue-500/10 text-blue-500',
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const formatDate = (date?: string | null) =>
    date ? format(new Date(date), "dd/MM/yyyy", { locale: ptBR }) : '-';

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <ResponsiveTable>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plano</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Valor</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Forma</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pago em</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border/50">
                  <td className="py-3 px-4">{payment.subscription?.tenant?.name || '-'}</td>
                  <td className="py-3 px-4">{payment.subscription?.plan?.name || '-'}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[payment.status] || 'bg-muted text-muted-foreground'}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize">{payment.payment_method || '-'}</td>
                  <td className="py-3 px-4">{formatDate(payment.paid_at)}</td>
                  <td className="py-3 px-4">{formatDate(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {payments.map((payment) => (
          <MobileCard
            key={payment.id}
            title={payment.subscription?.tenant?.name || 'Pagamento'}
            items={[
              { label: 'Plano', value: payment.subscription?.plan?.name || '-' },
              { label: 'Valor', value: formatCurrency(payment.amount) },
              { label: 'Status', value: payment.status },
              { label: 'Forma', value: payment.payment_method || '-' },
              { label: 'Pago em', value: formatDate(payment.paid_at) },
              { label: 'Criado em', value: formatDate(payment.created_at) },
            ]}
            footer={payment.invoice_url || ''}
          />
        ))}
      </div>
    </div>
  );
}

