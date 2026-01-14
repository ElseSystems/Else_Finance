import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { BlockedAccessModal } from '@/components/BlockedAccessModal';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAdmin, tenantAccess, refreshTenantAccess } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isBlocked = tenantAccess && !tenantAccess.can_access && !isAdmin;

  return (
    <div className="min-h-screen bg-background flex">
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="m-3">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar isAdmin={isAdmin} variant="drawer" onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar isAdmin={isAdmin} />
      )}
      
      <main className={cn("min-h-screen w-full transition-all duration-300", isMobile ? "ml-0" : "ml-64")}>
        <div className={cn("p-4 sm:p-6 lg:p-8", isMobile && "pt-16")}>
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
