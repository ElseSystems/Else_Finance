import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense';
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend,
  variant = 'default',
  className 
}: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn(
            'text-2xl lg:text-3xl font-display font-bold mt-2',
            variant === 'income' && 'text-income',
            variant === 'expense' && 'text-expense',
            variant === 'default' && 'text-foreground'
          )}>
            {value}
          </p>
          
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive ? 'text-income' : 'text-expense'
            )}>
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs mês anterior</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'p-3 rounded-xl',
          variant === 'income' && 'bg-income/10 text-income',
          variant === 'expense' && 'bg-expense/10 text-expense',
          variant === 'default' && 'bg-primary/10 text-primary'
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
