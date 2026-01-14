import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil, Calendar, Building2, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Subscription {
  id: string;
  tenant_id: string;
  tenant_name: string;
  plan_name: string;
  plan_price: number;
  status: string;
  start_date: string;
  end_date: string;
  is_trial: boolean;
  plan_id: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export function SubscriptionsManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    end_date: '',
    plan_id: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [subsResult, plansResult] = await Promise.all([
        supabase
          .from('subscriptions')
          .select(`
            id,
            tenant_id,
            status,
            start_date,
            end_date,
            is_trial,
            plan_id,
            tenants(name),
            plans(name, price)
          `)
          .order('end_date', { ascending: true }),
        supabase.from('plans').select('id, name, price').eq('is_active', true)
      ]);

      if (subsResult.error) {
        console.error('Erro ao buscar assinaturas:', subsResult.error);
        setError('Erro ao carregar assinaturas: ' + subsResult.error.message);
        setLoading(false);
        return;
      }

      if (subsResult.data) {
        const formatted = subsResult.data.map((s: any) => ({
          id: s.id,
          tenant_id: s.tenant_id,
          tenant_name: s.tenants?.name || 'N/A',
          plan_name: s.plans?.name || 'N/A',
          plan_price: Number(s.plans?.price) || 0,
          status: s.status,
          start_date: s.start_date,
          end_date: s.end_date,
          is_trial: s.is_trial,
          plan_id: s.plan_id
        }));
        setSubscriptions(formatted);
      }

      if (plansResult.data) {
        setPlans(plansResult.data.map(p => ({ ...p, price: Number(p.price) })));
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao carregar dados');
    }

    setLoading(false);
  };

  const openEditDialog = (subscription: Subscription) => {
    console.log('Abrindo edição para:', subscription);
    setEditingSubscription(subscription);
    setEditForm({
      status: subscription.status,
      end_date: subscription.end_date,
      plan_id: subscription.plan_id || ''
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSubscription(null);
  };

  const handleSave = async () => {
    if (!editingSubscription) return;
    
    setSaving(true);
    console.log('Salvando alterações:', editForm);
    
    try {
      // Atualiza a assinatura
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: editForm.status,
          end_date: editForm.end_date,
          plan_id: editForm.plan_id || editingSubscription.plan_id
        })
        .eq('id', editingSubscription.id);

      if (subError) {
        toast.error('Erro ao atualizar assinatura: ' + subError.message);
        console.error('Erro subscription update:', subError);
        setSaving(false);
        return;
      }

      // Atualiza o bloqueio do tenant baseado no status
      const isBlocked = editForm.status === 'blocked' || editForm.status === 'cancelled';
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          is_blocked: isBlocked,
          blocked_at: isBlocked ? new Date().toISOString() : null,
          block_reason: isBlocked ? `Status alterado para ${editForm.status}` : null
        })
        .eq('id', editingSubscription.tenant_id);

      if (tenantError) {
        toast.error('Erro ao atualizar status do tenant: ' + tenantError.message);
        console.error('Erro tenant update:', tenantError);
      } else {
        toast.success('Assinatura atualizada com sucesso!');
        closeDialog();
        fetchData();
      }
    } catch (err) {
      console.error('Erro inesperado ao salvar:', err);
      toast.error('Erro inesperado ao salvar');
    }
    
    setSaving(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-primary/10 text-primary',
      trial: 'bg-warning/10 text-warning',
      expired: 'bg-destructive/10 text-destructive',
      cancelled: 'bg-muted text-muted-foreground',
      blocked: 'bg-destructive/20 text-destructive'
    };
    
    const labels: Record<string, string> = {
      active: 'Ativo',
      trial: 'Trial',
      expired: 'Expirado',
      cancelled: 'Cancelado',
      blocked: 'Bloqueado'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.cancelled}`}>
        {labels[status] || status}
      </span>
    );
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-primary" size={24} />
          <h3 className="font-display font-semibold text-lg">Gerenciar Assinaturas</h3>
        </div>
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Carregando assinaturas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-primary" size={24} />
          <h3 className="font-display font-semibold text-lg">Gerenciar Assinaturas</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="text-primary" size={24} />
            <h3 className="font-display font-semibold text-lg">Gerenciar Assinaturas</h3>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plano</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Início</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vencimento</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr 
                  key={sub.id} 
                  className={`border-b border-border/50 hover:bg-muted/30 ${
                    isExpired(sub.end_date) ? 'bg-destructive/5' : 
                    isExpiringSoon(sub.end_date) ? 'bg-warning/5' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-muted-foreground" />
                      <span className="font-medium text-foreground">{sub.tenant_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-foreground">{sub.plan_name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {sub.plan_price.toFixed(2)}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(sub.status)}
                    {sub.is_trial && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                        Trial
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {format(new Date(sub.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className={
                        isExpired(sub.end_date) ? 'text-destructive' :
                        isExpiringSoon(sub.end_date) ? 'text-warning' : 'text-muted-foreground'
                      } />
                      <span className={
                        isExpired(sub.end_date) ? 'text-destructive font-medium' :
                        isExpiringSoon(sub.end_date) ? 'text-warning font-medium' : 'text-muted-foreground'
                      }>
                        {format(new Date(sub.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openEditDialog(sub)}
                      className="gap-1"
                    >
                      <Pencil size={14} />
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subscriptions.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Nenhuma assinatura encontrada
          </p>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
          </DialogHeader>
          
          {editingSubscription && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-foreground">{editingSubscription.tenant_name}</p>
                <p className="text-sm text-muted-foreground">
                  Plano atual: {editingSubscription.plan_name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
                {(editForm.status === 'blocked' || editForm.status === 'cancelled') && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle size={12} />
                    Isso bloqueará o acesso do usuário ao sistema
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Vencimento</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={editForm.end_date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  value={editForm.plan_id}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, plan_id: value }))}
                >
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Selecionar plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
