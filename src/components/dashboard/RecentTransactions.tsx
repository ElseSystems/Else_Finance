import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string | null;
  amount: number;
  date: string;
  cost_center?: { name: string; color: string } | null;
  chart_account?: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="stat-card">
      <h3 className="font-display font-semibold text-lg mb-4">
        Transações Recentes
      </h3>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma transação encontrada
          </p>
        ) : (
          transactions.map((transaction, index) => (
            <div 
              key={transaction.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                'p-2 rounded-lg',
                transaction.type === 'income' 
                  ? 'bg-income/10 text-income' 
                  : 'bg-expense/10 text-expense'
              )}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {transaction.description || 'Sem descrição'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                  {transaction.cost_center && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `${transaction.cost_center.color}20`,
                        color: transaction.cost_center.color 
                      }}
                    >
                      {transaction.cost_center.name}
                    </span>
                  )}
                </div>
              </div>
              
              <p className={cn(
                'font-semibold',
                transaction.type === 'income' ? 'text-income' : 'text-expense'
              )}>
                {transaction.type === 'expense' && '-'}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
