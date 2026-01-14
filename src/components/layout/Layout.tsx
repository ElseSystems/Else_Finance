import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { BlockedAccessModal } from '@/components/BlockedAccessModal';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin, tenantAccess, refreshTenantAccess } = useAuth();

  const isBlocked = tenantAccess && !tenantAccess.can_access && !isAdmin;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      
      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      <VoiceButton />

      {isBlocked && (
        <BlockedAccessModal
          isOpen={true}
          blockReason={tenantAccess?.block_reason || null}
          isPaymentDue={tenantAccess?.is_payment_due || false}
          amountDue={tenantAccess?.amount_due || 0}
          onPaymentComplete={refreshTenantAccess}
        />
      )}
    </div>
  );
}
