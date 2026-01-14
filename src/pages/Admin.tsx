import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminStats } from '@/components/admin/AdminStats';
import { UsersTable } from '@/components/admin/UsersTable';
import { SubscriptionsManager } from '@/components/admin/SubscriptionsManager';

interface AdminStats {
  totalUsers: number;
  totalTenants: number;
  totalTransactions: number;
}

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  tenant_name: string | null;
  role: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTenants: 0,
    totalTransactions: 0,
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

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
    const [usersCount, tenantsCount, transactionsCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('tenants').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalTenants: tenantsCount.count || 0,
      totalTransactions: transactionsCount.count || 0,
    });

    const { data: profilesData } = await supabase
      .from('profiles')
      .select(`
        user_id,
        full_name,
        email,
        tenant:tenants(name)
      `)
      .limit(20);

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
            role: roleData?.role || 'user',
          };
        })
      );

      setUsers(usersWithRoles);
    }

    setLoading(false);
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
        <p className="text-muted-foreground">Gerencie usuários, assinaturas e visualize estatísticas do sistema</p>
      </div>

      <AdminStats 
        totalUsers={stats.totalUsers}
        totalTenants={stats.totalTenants}
        totalTransactions={stats.totalTransactions}
      />

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <SubscriptionsManager />
        </TabsContent>

        <TabsContent value="users">
          <div className="stat-card">
            <h3 className="font-display font-semibold text-lg mb-4">Usuários Recentes</h3>
            <UsersTable users={users} loading={loading} />
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
