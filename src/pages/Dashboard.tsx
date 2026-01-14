import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionChart } from '@/components/dashboard/TransactionChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { CostCenterChart } from '@/components/dashboard/CostCenterChart';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval } from 'date-fns';

interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  savings: number;
  incomeTrend: number;
  expenseTrend: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    incomeTrend: 0,
    expenseTrend: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; income: number; expense: number }[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [costCenterData, setCostCenterData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchDashboardData();
    }
  }, [profile?.tenant_id]);

  const fetchDashboardData = async () => {
    if (!profile?.tenant_id) return;
    
    const now = new Date();
    const startCurrent = startOfMonth(now);
    const endCurrent = endOfMonth(now);
    const startPrevious = startOfMonth(subMonths(now, 1));
    const endPrevious = endOfMonth(subMonths(now, 1));

    // Fetch current month transactions
    const { data: currentMonthData } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .gte('date', format(startCurrent, 'yyyy-MM-dd'))
      .lte('date', format(endCurrent, 'yyyy-MM-dd'));

    // Fetch previous month transactions
    const { data: previousMonthData } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .gte('date', format(startPrevious, 'yyyy-MM-dd'))
      .lte('date', format(endPrevious, 'yyyy-MM-dd'));

    // Fetch recent transactions
    const { data: recentData } = await supabase
      .from('transactions')
      .select(`
        *,
        cost_center:cost_centers(name, color),
        chart_account:chart_of_accounts(name)
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('date', { ascending: false })
      .limit(5);

    // Fetch cost center expenses
    const { data: costCenterExpenses } = await supabase
      .from('transactions')
      .select(`
        amount,
        cost_center:cost_centers(name, color)
      `)
      .eq('tenant_id', profile.tenant_id)
      .eq('type', 'expense')
      .gte('date', format(startCurrent, 'yyyy-MM-dd'))
      .lte('date', format(endCurrent, 'yyyy-MM-dd'));

    // Calculate stats
    const currentIncome = currentMonthData?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const currentExpense = currentMonthData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const previousIncome = previousMonthData?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const previousExpense = previousMonthData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const incomeTrend = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseTrend = previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;

    setStats({
      totalBalance: currentIncome - currentExpense,
      totalIncome: currentIncome,
      totalExpense: currentExpense,
      savings: currentIncome - currentExpense,
      incomeTrend,
      expenseTrend,
    });

    setRecentTransactions(recentData || []);

    // Process chart data
    const days = eachDayOfInterval({ start: startCurrent, end: now });
    const chartDataMap = new Map<string, { income: number; expense: number }>();
    
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      chartDataMap.set(dateKey, { income: 0, expense: 0 });
    });

    currentMonthData?.forEach(transaction => {
      const existing = chartDataMap.get(transaction.date) || { income: 0, expense: 0 };
      if (transaction.type === 'income') {
        existing.income += Number(transaction.amount);
      } else {
        existing.expense += Number(transaction.amount);
      }
      chartDataMap.set(transaction.date, existing);
    });

    setChartData(
      Array.from(chartDataMap.entries()).map(([date, values]) => ({
        date,
        ...values,
      }))
    );

    // Process cost center data
    const costCenterMap = new Map<string, { value: number; color: string }>();
    costCenterExpenses?.forEach(expense => {
      if (expense.cost_center) {
        const existing = costCenterMap.get(expense.cost_center.name) || { value: 0, color: expense.cost_center.color };
        existing.value += Number(expense.amount);
        costCenterMap.set(expense.cost_center.name, existing);
      }
    });

    setCostCenterData(
      Array.from(costCenterMap.entries()).map(([name, data]) => ({
        name,
        ...data,
      }))
    );

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das suas finanças
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(stats.totalBalance)}
          icon={<Wallet size={24} />}
          variant={stats.totalBalance >= 0 ? 'income' : 'expense'}
        />
        
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(stats.totalIncome)}
          icon={<TrendingUp size={24} />}
          variant="income"
          trend={stats.incomeTrend !== 0 ? { 
            value: Math.round(stats.incomeTrend), 
            isPositive: stats.incomeTrend > 0 
          } : undefined}
        />
        
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(stats.totalExpense)}
          icon={<TrendingDown size={24} />}
          variant="expense"
          trend={stats.expenseTrend !== 0 ? { 
            value: Math.round(stats.expenseTrend), 
            isPositive: stats.expenseTrend < 0 
          } : undefined}
        />
        
        <StatCard
          title="Economia"
          value={formatCurrency(stats.savings)}
          icon={<PiggyBank size={24} />}
          variant={stats.savings >= 0 ? 'income' : 'expense'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <TransactionChart data={chartData} />
        </div>
        <div>
          <CostCenterChart data={costCenterData} />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentTransactions} />
    </Layout>
  );
}
