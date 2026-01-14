import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Building2, ArrowDownUp, Loader2 } from 'lucide-react';

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
  const { profile, user, loading: authLoading } = useAuth();
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
    // Get stats
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

    // Get users with their roles
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
        <p className="text-muted-foreground">Gerencie usuários e visualize estatísticas do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <Users className="text-primary" size={28} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
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
              <p className="text-sm text-muted-foreground">Total de Tenants</p>
              <p className="text-3xl font-display font-bold text-foreground">{stats.totalTenants}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <ArrowDownUp className="text-primary" size={28} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Transações</p>
              <p className="text-3xl font-display font-bold text-foreground">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="stat-card">
        <h3 className="font-display font-semibold text-lg mb-4">Usuários Recentes</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
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
    </Layout>
  );
}
