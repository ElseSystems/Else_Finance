import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TenantAccess {
  canAccess: boolean;
  blockReason: string | null;
  isPaymentDue: boolean;
  subscriptionStatus: string;
  loading: boolean;
  isAdmin: boolean;
}

export function useTenantAccess(): TenantAccess {
  const { profile, user } = useAuth();
  const [access, setAccess] = useState<TenantAccess>({
    canAccess: true,
    blockReason: null,
    isPaymentDue: false,
    subscriptionStatus: 'active',
    loading: true,
    isAdmin: false
  });

  useEffect(() => {
    if (user) {
      checkAccess();
    } else {
      setAccess(prev => ({ ...prev, loading: false }));
    }
  }, [user, profile?.tenant_id]);

  const checkAccess = async () => {
    if (!user) {
      setAccess(prev => ({ ...prev, loading: false }));
      return;
    }

    // Primeiro verifica se é admin - admins sempre têm acesso
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleData?.role === 'admin') {
      setAccess({
        canAccess: true,
        blockReason: null,
        isPaymentDue: false,
        subscriptionStatus: 'admin',
        loading: false,
        isAdmin: true
      });
      return;
    }

    if (!profile?.tenant_id) {
      setAccess(prev => ({ ...prev, loading: false, isAdmin: false }));
      return;
    }

    // Verifica se o tenant está bloqueado
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('is_blocked, block_reason')
      .eq('id', profile.tenant_id)
      .maybeSingle();

    if (tenantError) {
      console.error('Erro ao verificar tenant:', tenantError);
      setAccess(prev => ({ ...prev, loading: false, isAdmin: false }));
      return;
    }

    if (tenant?.is_blocked) {
      setAccess({
        canAccess: false,
        blockReason: tenant.block_reason || 'Acesso bloqueado pelo administrador',
        isPaymentDue: false,
        subscriptionStatus: 'blocked',
        loading: false,
        isAdmin: false
      });
      return;
    }

    // Verifica a assinatura
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('status, end_date')
      .eq('tenant_id', profile.tenant_id)
      .order('end_date', { ascending: false })
      .limit(1);

    if (subError) {
      console.error('Erro ao verificar assinatura:', subError);
      setAccess(prev => ({ ...prev, loading: false, isAdmin: false }));
      return;
    }

    const subscription = subscriptions?.[0];

    if (!subscription) {
      setAccess({
        canAccess: false,
        blockReason: 'Nenhuma assinatura encontrada',
        isPaymentDue: true,
        subscriptionStatus: 'no_subscription',
        loading: false,
        isAdmin: false
      });
      return;
    }

    const isExpired = new Date(subscription.end_date) < new Date();
    const isBlocked = subscription.status === 'blocked' || subscription.status === 'cancelled';

    if (isBlocked) {
      setAccess({
        canAccess: false,
        blockReason: 'Sua assinatura foi cancelada ou bloqueada',
        isPaymentDue: false,
        subscriptionStatus: subscription.status,
        loading: false,
        isAdmin: false
      });
      return;
    }

    if (isExpired) {
      setAccess({
        canAccess: false,
        blockReason: 'Sua assinatura expirou',
        isPaymentDue: true,
        subscriptionStatus: 'expired',
        loading: false,
        isAdmin: false
      });
      return;
    }

    setAccess({
      canAccess: true,
      blockReason: null,
      isPaymentDue: false,
      subscriptionStatus: subscription.status,
      loading: false,
      isAdmin: false
    });
  };

  return access;
}
