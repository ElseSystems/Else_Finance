import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string | null;
  amount: number;
  date: string;
  is_paid: boolean;
  cost_center_id: string | null;
  chart_account_id: string | null;
  cost_center?: { name: string; color: string } | null;
  chart_account?: { name: string } | null;
}

interface CostCenter {
  id: string;
  name: string;
  color: string;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: 'income' | 'expense';
}

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('new') === 'true');

  // Form state
  const [formType, setFormType] = useState<'income' | 'expense'>(
    (searchParams.get('type') as 'income' | 'expense') || 'expense'
  );
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formCostCenter, setFormCostCenter] = useState('');
  const [formChartAccount, setFormChartAccount] = useState('');
  const [formIsPaid, setFormIsPaid] = useState(false);

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData();
    }
  }, [profile?.tenant_id]);

  const fetchData = async () => {
    if (!profile?.tenant_id) return;

    const [transactionsRes, costCentersRes, chartAccountsRes] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          *,
          cost_center:cost_centers(name, color),
          chart_account:chart_of_accounts(name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('date', { ascending: false }),
      supabase
        .from('cost_centers')
        .select('id, name, color')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true),
      supabase
        .from('chart_of_accounts')
        .select('id, code, name, type')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true),
    ]);

    setTransactions(transactionsRes.data || []);
    setCostCenters(costCentersRes.data || []);
    setChartAccounts(chartAccountsRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('transactions').insert({
      tenant_id: profile!.tenant_id,
      type: formType,
      description: formDescription,
      amount: parseFloat(formAmount),
      date: formDate,
      cost_center_id: formCostCenter || null,
      chart_account_id: formChartAccount || null,
      is_paid: formIsPaid,
      created_by: profile!.user_id,
    });

    if (error) {
      toast({
        title: 'Erro ao criar transação',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Transação criada!',
        description: 'A transação foi registrada com sucesso.',
      });
      resetForm();
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Transação excluída',
      });
      fetchData();
    }
  };

  const resetForm = () => {
    setFormDescription('');
    setFormAmount('');
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormCostCenter('');
    setFormChartAccount('');
    setFormIsPaid(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(search.toLowerCase()) || 
                         t.cost_center?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredChartAccounts = chartAccounts.filter(ca => ca.type === formType);

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Transações</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas receitas e despesas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Transação</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    formType === 'income'
                      ? 'border-income bg-income/10 text-income'
                      : 'border-border hover:border-income/50'
                  )}
                >
                  <ArrowUpRight size={20} />
                  <span className="font-medium">Receita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    formType === 'expense'
                      ? 'border-expense bg-expense/10 text-expense'
                      : 'border-border hover:border-expense/50'
                  )}
                >
                  <ArrowDownRight size={20} />
                  <span className="font-medium">Despesa</span>
                </button>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Pagamento de aluguel"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Select value={formCostCenter} onValueChange={setFormCostCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cc.color }}
                          />
                          {cc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plano de Contas</Label>
                <Select value={formChartAccount} onValueChange={setFormChartAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChartAccounts.map((ca) => (
                      <SelectItem key={ca.id} value={ca.id}>
                        {ca.code} - {ca.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formIsPaid}
                  onChange={(e) => setFormIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="isPaid" className="font-normal">
                  {formType === 'income' ? 'Recebido' : 'Pago'}
                </Label>
              </div>

              <Button type="submit" className="w-full">
                Criar Transação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="stat-card">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors animate-fade-in group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className={cn(
                  'p-3 rounded-xl',
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
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(transaction.date), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    {transaction.cost_center && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${transaction.cost_center.color}20`,
                          color: transaction.cost_center.color,
                        }}
                      >
                        {transaction.cost_center.name}
                      </span>
                    )}
                    {transaction.chart_account && (
                      <span className="text-xs text-muted-foreground">
                        {transaction.chart_account.name}
                      </span>
                    )}
                  </div>
                </div>

                <p className={cn(
                  'font-semibold text-lg',
                  transaction.type === 'income' ? 'text-income' : 'text-expense'
                )}>
                  {transaction.type === 'expense' && '-'}
                  {formatCurrency(transaction.amount)}
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(transaction.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
