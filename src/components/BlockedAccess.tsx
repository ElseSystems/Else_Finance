import { ShieldX, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface BlockedAccessProps {
  reason: string | null;
  isPaymentDue: boolean;
}

export function BlockedAccess({ reason, isPaymentDue }: BlockedAccessProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="stat-card p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            {isPaymentDue ? (
              <CreditCard className="w-8 h-8 text-destructive" />
            ) : (
              <ShieldX className="w-8 h-8 text-destructive" />
            )}
          </div>
          
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Acesso Bloqueado
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {reason || 'Seu acesso ao sistema foi bloqueado.'}
          </p>

          <div className="p-4 bg-warning/10 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle size={18} />
              <span className="font-medium">O que fazer?</span>
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {isPaymentDue 
                ? 'Entre em contato com o administrador para regularizar sua assinatura.'
                : 'Entre em contato com o suporte para mais informações sobre o bloqueio.'}
            </p>
          </div>

          <Button variant="outline" onClick={signOut} className="w-full">
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
