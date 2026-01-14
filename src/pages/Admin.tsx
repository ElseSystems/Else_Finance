import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Building2, ArrowDownUp, Loader2, CreditCard, Package, Calendar, Plus, Edit, X, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminStats {
  totalUsers: number;
  totalTenants: number;
  totalTransactions: number;
  activeSubscriptions: number;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  tenant_name: string | null;
  tenant_id: string | null;
  role: string;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  is_active: boolean;
}

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_method: string | null;
  tenant?: { name: string };
  plan?: Plan;
}

interface TenantWithSubscription {
  id: string;
  name: string;
  created_at: string;
  subscription?: Subscription | null;
}

export default function Admin() {
  const { profile, user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTenants: 0,
    totalTransactions: 0,
    activeSubscriptions: 0,
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<TenantWithSubscription[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();

  // Plan form state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '1',
  });

  // Subscription form state
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithSubscription | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: '',
    end_date: '',
    payment_method: 'pix' as 'credit_card' | 'pix' | 'boleto',
  });

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const checkAdminRole = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!error && data?.role === 'admin');
  };

  const fetchAdminData = async () => {
    setLoading(true);
    
    // Get stats
    const [usersCount, tenantsCount, transactionsCount, activeSubsCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalTenants: tenantsCount.count || 0,
      totalTransactions: transactionsCount.count || 0,
      activeSubscriptions: activeSubsCount.count || 0,
    });

    // Get users with their roles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        email,
        tenant_id,
        tenant:tenants(name)
      `)
      .limit(50);

    if (profilesData) {
      const usersWithRoles = await Promise.all(
        profilesData.map(async (p: any) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', p.user_id)
            .single();

          return {
            id: p.user_id,
            email: p.email,
            full_name: p.full_name,
            tenant_name: p.tenant?.name || null,
            tenant_id: p.tenant_id,
            role: roleData?.role || 'user',
          };
        })
      );
      setUsers(usersWithRoles);
    }

    // Get plans
    const { data: plansData } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
    
    if (plansData) setPlans(plansData);

    // Get all tenants with subscriptions
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: subsData } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .order('end_date', { ascending: true });

    if (subsData) setSubscriptions(subsData as any);

    if (tenantsData && subsData) {
      const tenantsWithSubs = tenantsData.map((tenant) => ({
        ...tenant,
        subscription: subsData.find((s) => s.tenant_id === tenant.id && s.status === 'active') || null,
      }));
      setTenants(tenantsWithSubs as any);
    }

    setLoading(false);
  };

  const handleSavePlan = async () => {
    try {
      const planData = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        duration_months: parseInt(planForm.duration_months),
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast({ title: 'Plano atualizado com sucesso!' });
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(planData);

        if (error) throw error;
        toast({ title: 'Plano criado com sucesso!' });
      }

      setPlanDialogOpen(false);
      setEditingPlan(null);
      setPlanForm({ name: '', description: '', price: '', duration_months: '1' });
      fetchAdminData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleTogglePlanActive = async (plan: Plan) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;
      toast({ title: plan.is_active ? 'Plano desativado' : 'Plano ativado' });
      fetchAdminData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedTenant) return;

    try {
      const selectedPlan = plans.find(p => p.id === subscriptionForm.plan_id);
      if (!selectedPlan) throw new Error('Selecione um plano');

      const startDate = new Date();
      const endDate = new Date(subscriptionForm.end_date);

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: selectedTenant.id,
          plan_id: subscriptionForm.plan_id,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          payment_method: subscriptionForm.payment_method,
        });

      if (error) throw error;

      toast({ title: 'Assinatura criada com sucesso!' });
      setSubscriptionDialogOpen(false);
      setSelectedTenant(null);
      setSubscriptionForm({ plan_id: '', end_date: '', payment_method: 'pix' });
      fetchAdminData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast({ title: 'Assinatura cancelada' });
      fetchAdminData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const getSubscriptionStatus = (subscription: Subscription | null | undefined) => {
    if (!subscription) return { label: 'Sem plano', color: 'bg-muted text-muted-foreground' };
    
    const daysUntilExpiry = differenceInDays(new Date(subscription.end_date), new Date());
    
    if (subscription.status === 'cancelled') {
      return { label: 'Cancelado', color: 'bg-red-500/10 text-red-500' };
    }
    if (subscription.status === 'expired' || daysUntilExpiry < 0) {
      return { label: 'Expirado', color: 'bg-red-500/10 text-red-500' };
    }
    if (daysUntilExpiry <= 2) {
      return { label: `Expira em ${daysUntilExpiry} dias`, color: 'bg-yellow-500/10 text-yellow-500' };
    }
    return { label: 'Ativo', color: 'bg-primary/10 text-primary' };
  };

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_months: plan.duration_months.toString(),
    });
    setPlanDialogOpen(true);
  };

  const openCreateSubscription = (tenant: TenantWithSubscription) => {
    setSelectedTenant(tenant);
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
    setSubscriptionForm({
      plan_id: plans[0]?.id || '',
      end_date: defaultEndDate.toISOString().split('T')[0],
      payment_method: 'pix',
    });
    setSubscriptionDialogOpen(true);
  };

  if (authLoading || isAdmin === null) {
    return (
      <Layout isAdmin>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout isAdmin>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-primary" size={32} />
          <h1 className="font-display text-3xl font-bold text-foreground">Painel Admin</h1>
        </div>
        <p className="text-muted-foreground">Gerencie empresas, planos e assinaturas do sistema</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Users className="text-primary" size={28} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuários</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <Building2 className="text-primary" size={28} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Empresas</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.totalTenants}</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <CreditCard className="text-primary" size={28} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-primary/10">
                  <ArrowDownUp className="text-primary" size={28} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transações</p>
                  <p className="text-3xl font-display font-bold text-foreground">{stats.totalTransactions}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-500" size={20} />
              <h3 className="font-display font-semibold text-lg">Assinaturas Próximas do Vencimento</h3>
            </div>
            
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="space-y-3">
                {subscriptions
                  .filter(s => s.status === 'active' && differenceInDays(new Date(s.end_date), new Date()) <= 7)
                  .map(sub => {
                    const tenant = tenants.find(t => t.id === sub.tenant_id);
                    const daysLeft = differenceInDays(new Date(sub.end_date), new Date());
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <div>
                          <p className="font-medium text-foreground">{tenant?.name || 'Empresa'}</p>
                          <p className="text-sm text-muted-foreground">
                            {sub.plan?.name} • Vence em {format(new Date(sub.end_date), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          daysLeft <= 2 ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {daysLeft} dias restantes
                        </span>
                      </div>
                    );
                  })}
                {subscriptions.filter(s => s.status === 'active' && differenceInDays(new Date(s.end_date), new Date()) <= 7).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Nenhuma assinatura próxima do vencimento</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <div className="stat-card">
            <h3 className="font-display font-semibold text-lg mb-4">Empresas Cadastradas</h3>
            
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Empresa</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plano</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Forma Pagto</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => {
                      const status = getSubscriptionStatus(tenant.subscription);
                      return (
                        <tr key={tenant.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium text-foreground">{tenant.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {tenant.subscription?.plan?.name || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {tenant.subscription 
                              ? format(new Date(tenant.subscription.end_date), "dd/MM/yyyy", { locale: ptBR })
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground capitalize">
                            {tenant.subscription?.payment_method?.replace('_', ' ') || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {!tenant.subscription || tenant.subscription.status !== 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openCreateSubscription(tenant)}
                                >
                                  <Plus size={14} className="mr-1" />
                                  Assinar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelSubscription(tenant.subscription!.id)}
                                >
                                  <X size={14} className="mr-1" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold text-lg">Planos Disponíveis</h3>
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({ name: '', description: '', price: '', duration_months: '1' });
                }}>
                  <Plus size={18} className="mr-2" />
                  Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome do Plano</Label>
                    <Input
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="Ex: Mensal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Ex: Plano mensal com acesso completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={planForm.price}
                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                        placeholder="50.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duração (meses)</Label>
                      <Select
                        value={planForm.duration_months}
                        onValueChange={(v) => setPlanForm({ ...planForm, duration_months: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 mês</SelectItem>
                          <SelectItem value="3">3 meses</SelectItem>
                          <SelectItem value="6">6 meses</SelectItem>
                          <SelectItem value="12">12 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleSavePlan}>
                    {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className={`stat-card relative ${!plan.is_active ? 'opacity-60' : ''}`}>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEditPlan(plan)}>
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleTogglePlanActive(plan)}
                  >
                    {plan.is_active ? <X size={16} /> : <Check size={16} />}
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Package className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-foreground">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">{plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold text-primary">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-muted-foreground">/{plan.duration_months === 1 ? 'mês' : `${plan.duration_months} meses`}</span>
                </div>
                
                {!plan.is_active && (
                  <span className="inline-block mt-3 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    Inativo
                  </span>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="stat-card">
            <h3 className="font-display font-semibold text-lg mb-4">Usuários do Sistema</h3>
            
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">E-mail</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Empresa</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Função</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {user.full_name || 'Sem nome'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {user.tenant_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Assinatura - {selectedTenant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select
                value={subscriptionForm.plan_id}
                onValueChange={(v) => {
                  const plan = plans.find(p => p.id === v);
                  const endDate = new Date();
                  endDate.setMonth(endDate.getMonth() + (plan?.duration_months || 1));
                  setSubscriptionForm({
                    ...subscriptionForm,
                    plan_id: v,
                    end_date: endDate.toISOString().split('T')[0],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.is_active).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2).replace('.', ',')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={subscriptionForm.end_date}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, end_date: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={subscriptionForm.payment_method}
                onValueChange={(v: 'credit_card' | 'pix' | 'boleto') => setSubscriptionForm({ ...subscriptionForm, payment_method: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full" onClick={handleCreateSubscription}>
              <Calendar size={18} className="mr-2" />
              Criar Assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
