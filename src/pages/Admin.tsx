import { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminStats } from '@/components/admin/AdminStats';
import { TenantsTable } from '@/components/admin/TenantsTable';
import { SubscriptionEditDialog } from '@/components/admin/SubscriptionEditDialog';

interface AdminStatsData {
  totalUsers: number;
  totalTenants: number;
  totalTransactions: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

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

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStatsData>({
    totalUsers: 0,
    totalTenants: 0,
    totalTransactions: 0,
  });
  const [tenants, setTenants] = useState<TenantWithSubscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState<TenantWithSubscription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const checkAdminRole = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!error && data?.role === 'admin');
  }, [user]);

  const fetchAdminData = useCallback(async () => {
    // Get stats
    const [usersCount, tenantsCount, transactionsCount, plansData] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
      supabase.from('plans').select('*').eq('is_active', true).order('price'),
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalTenants: tenantsCount.count || 0,
      totalTransactions: transactionsCount.count || 0,
    });

    if (plansData.data) {
      setPlans(plansData.data);
    }

    // Get tenants with their subscriptions
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('id, name, is_blocked')
      .order('name');

    if (tenantsData) {
      const tenantsWithSubs = await Promise.all(
        tenantsData.map(async (t) => {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select(`
              id,
              plan_id,
              status,
              end_date,
              plan:plans(name)
            `)
            .eq('tenant_id', t.id)
            .order('end_date', { ascending: false })
            .limit(1)
            .single();

          return {
            id: t.id,
            name: t.name,
            is_blocked: t.is_blocked || false,
            plan_id: subData?.plan_id || null,
            plan_name: (subData?.plan as any)?.name || null,
            status: subData?.status || null,
            end_date: subData?.end_date || null,
            subscription_id: subData?.id || null,
          };
        })
      );

      setTenants(tenantsWithSubs);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user, checkAdminRole]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  const handleEditTenant = (tenant: TenantWithSubscription) => {
    setEditingTenant(tenant);
    setDialogOpen(true);
  };

  const handleSaveSubscription = async (
    tenantId: string,
    subscriptionId: string | null,
    planId: string,
    endDate: Date,
    status: string
  ) => {
    try {
      const isBlocked = status === 'blocked';
      
      // Update tenant blocked status
      await supabase
        .from('tenants')
        .update({ 
          is_blocked: isBlocked,
          blocked_at: isBlocked ? new Date().toISOString() : null,
          block_reason: isBlocked ? 'Bloqueado pelo administrador' : null
        })
        .eq('id', tenantId);

      const subscriptionData = {
        plan_id: planId,
        end_date: endDate.toISOString().split('T')[0],
        status: isBlocked ? 'blocked' : status,
      };

      if (subscriptionId) {
        // Update existing subscription
        await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', subscriptionId);
      } else {
        // Create new subscription
        await supabase
          .from('subscriptions')
          .insert({
            ...subscriptionData,
            tenant_id: tenantId,
            start_date: new Date().toISOString().split('T')[0],
          });
      }

      toast.success('Assinatura atualizada com sucesso!');
      fetchAdminData();
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast.error('Erro ao salvar assinatura');
    }
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
        <p className="text-muted-foreground">Gerencie assinaturas e visualize estatísticas do sistema</p>
      </div>

      <AdminStats
        totalUsers={stats.totalUsers}
        totalTenants={stats.totalTenants}
        totalTransactions={stats.totalTransactions}
      />

      <div className="stat-card">
        <h3 className="font-display font-semibold text-lg mb-4">Empresas e Assinaturas</h3>
        <TenantsTable
          tenants={tenants}
          loading={loading}
          onEdit={handleEditTenant}
        />
      </div>

      <SubscriptionEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenant={editingTenant}
        plans={plans}
        onSave={handleSaveSubscription}
      />
    </Layout>
  );
}
