import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Edit2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  is_active: boolean;
}

export default function ChartAccounts() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchChartAccounts();
    }
  }, [profile?.tenant_id]);

  const fetchChartAccounts = async () => {
    if (!profile?.tenant_id) return;

    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('code');

    if (!error && data) {
      setChartAccounts(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('chart_of_accounts')
        .update({
          code: formCode,
          name: formName,
          type: formType,
        })
        .eq('id', editingId);

      if (error) {
        toast({
          title: 'Erro ao atualizar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Conta atualizada!' });
        resetForm();
        fetchChartAccounts();
      }
    } else {
      const { error } = await supabase.from('chart_of_accounts').insert({
        tenant_id: profile!.tenant_id,
        code: formCode,
        name: formName,
        type: formType,
      });

      if (error) {
        toast({
          title: 'Erro ao criar',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Conta criada!' });
        resetForm();
        fetchChartAccounts();
      }
    }
  };

  const handleEdit = (account: ChartAccount) => {
    setEditingId(account.id);
    setFormCode(account.code);
    setFormName(account.name);
    setFormType(account.type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Conta excluída' });
      fetchChartAccounts();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormCode('');
    setFormName('');
    setFormType('expense');
    setIsDialogOpen(false);
  };

  const incomeAccounts = chartAccounts.filter(a => a.type === 'income');
  const expenseAccounts = chartAccounts.filter(a => a.type === 'expense');

  const AccountCard = ({ account, index }: { account: ChartAccount; index: number }) => (
    <div
      className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors group animate-fade-in"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          account.type === 'income' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
        )}>
          {account.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
        </div>
        <div>
          <p className="font-medium text-foreground">{account.code} - {account.name}</p>
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleEdit(account)}
          className="h-8 w-8"
        >
          <Edit2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(account.id)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Plano de Contas</h1>
          <p className="text-muted-foreground mt-1">Estruture suas receitas e despesas</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingId ? 'Editar Conta' : 'Nova Conta'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    formType === 'income'
                      ? 'border-income bg-income/10 text-income'
                      : 'border-border hover:border-income/50'
                  )}
                >
                  <ArrowUpRight size={18} />
                  <span className="font-medium">Receita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                    formType === 'expense'
                      ? 'border-expense bg-expense/10 text-expense'
                      : 'border-border hover:border-expense/50'
                  )}
                >
                  <ArrowDownRight size={18} />
                  <span className="font-medium">Despesa</span>
                </button>
              </div>

              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  placeholder="Ex: 1.1"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Vendas"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {editingId ? 'Atualizar' : 'Criar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : chartAccounts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Accounts */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="text-income" size={24} />
              <h3 className="font-display font-semibold text-lg">Receitas</h3>
              <span className="ml-auto text-sm text-muted-foreground">
                {incomeAccounts.length} contas
              </span>
            </div>
            <div className="space-y-1">
              {incomeAccounts.map((account, index) => (
                <AccountCard key={account.id} account={account} index={index} />
              ))}
            </div>
          </div>

          {/* Expense Accounts */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownRight className="text-expense" size={24} />
              <h3 className="font-display font-semibold text-lg">Despesas</h3>
              <span className="ml-auto text-sm text-muted-foreground">
                {expenseAccounts.length} contas
              </span>
            </div>
            <div className="space-y-1">
              {expenseAccounts.map((account, index) => (
                <AccountCard key={account.id} account={account} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
