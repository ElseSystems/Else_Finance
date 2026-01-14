import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TenantAccess {
  canAccess: boolean;
  blockReason: string | null;
  isPaymentDue: boolean;
  subscriptionStatus: string;
  loading: boolean;
}

export function useTenantAccess(): TenantAccess {
  const { profile } = useAuth();
  const [access, setAccess] = useState<TenantAccess>({
    canAccess: true,
    blockReason: null,
    isPaymentDue: false,
    subscriptionStatus: 'active',
    loading: true
  });

  useEffect(() => {
    if (profile?.tenant_id) {
      checkAccess();
    }
  }, [profile?.tenant_id]);

  const checkAccess = async () => {
    if (!profile?.tenant_id) {
      setAccess(prev => ({ ...prev, loading: false }));
      return;
    }

    // Verifica se o tenant está bloqueado
    const { data: tenant } = await supabase
      .from('tenants')
      .select('is_blocked, block_reason')
      .eq('id', profile.tenant_id)
      .single();

    if (tenant?.is_blocked) {
      setAccess({
        canAccess: false,
        blockReason: tenant.block_reason || 'Acesso bloqueado pelo administrador',
        isPaymentDue: false,
        subscriptionStatus: 'blocked',
        loading: false
      });
      return;
    }

    // Verifica a assinatura
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, end_date')
      .eq('tenant_id', profile.tenant_id)
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      setAccess({
        canAccess: false,
        blockReason: 'Nenhuma assinatura encontrada',
        isPaymentDue: true,
        subscriptionStatus: 'no_subscription',
        loading: false
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
        loading: false
      });
      return;
    }

    if (isExpired) {
      setAccess({
        canAccess: false,
        blockReason: 'Sua assinatura expirou',
        isPaymentDue: true,
        subscriptionStatus: 'expired',
        loading: false
      });
      return;
    }

    setAccess({
      canAccess: true,
      blockReason: null,
      isPaymentDue: false,
      subscriptionStatus: subscription.status,
      loading: false
    });
  };

  return access;
}
