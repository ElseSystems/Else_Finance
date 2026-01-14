import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageCircle, CreditCard, QrCode, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BlockedAccessModalProps {
  isOpen: boolean;
  blockReason: string | null;
  isPaymentDue: boolean;
  amountDue: number;
  onPaymentComplete?: () => void;
}

export function BlockedAccessModal({ 
  isOpen, 
  blockReason, 
  isPaymentDue, 
  amountDue,
  onPaymentComplete 
}: BlockedAccessModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'boleto' | null>(null);
  const { toast } = useToast();

  const ADMIN_WHATSAPP = '5561994053333';

  const handleContactAdmin = () => {
    const message = encodeURIComponent('Olá! Preciso de ajuda com meu acesso ao FinanceApp.');
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${message}`, '_blank');
  };

  const handlePayment = async (method: 'pix' | 'credit_card' | 'boleto') => {
    setLoading(true);
    setPaymentMethod(method);

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago', {
        body: {
          action: 'create_payment',
          payment_method: method,
          amount: amountDue,
          description: 'Pagamento de assinatura - FinanceApp',
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.open(data.init_point, '_blank');
        toast({
          title: 'Redirecionando para pagamento',
          description: 'Complete o pagamento na nova janela.',
        });
      } else if (data?.qr_code_base64) {
        // For PIX, could show QR code
        toast({
          title: 'PIX gerado',
          description: 'Use o código para efetuar o pagamento.',
        });
      } else if (data?.barcode) {
        // For boleto
        toast({
          title: 'Boleto gerado',
          description: 'Use o código de barras para efetuar o pagamento.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar o pagamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setPaymentMethod(null);
    }
  };

  const isManualBlock = blockReason === 'manual' || (!isPaymentDue && blockReason);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl">Acesso Bloqueado</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {isManualBlock ? (
              <>
                Seu acesso foi bloqueado. Por favor, entre em contato com o administrador 
                da aplicação para mais informações.
              </>
            ) : (
              <>
                Sua assinatura está vencida. Para continuar usando o sistema, 
                efetue o pagamento do valor em aberto.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isManualBlock ? (
            <Button 
              className="w-full h-12"
              onClick={handleContactAdmin}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Contatar Administrador via WhatsApp
            </Button>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Valor em aberto</p>
                <p className="text-3xl font-bold text-foreground">
                  R$ {amountDue.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Escolha a forma de pagamento:
              </p>

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  className="h-14 justify-start"
                  onClick={() => handlePayment('pix')}
                  disabled={loading}
                >
                  {loading && paymentMethod === 'pix' ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <QrCode className="mr-3 h-5 w-5 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">PIX</p>
                    <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-14 justify-start"
                  onClick={() => handlePayment('credit_card')}
                  disabled={loading}
                >
                  {loading && paymentMethod === 'credit_card' ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="mr-3 h-5 w-5 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">Cartão de Crédito</p>
                    <p className="text-xs text-muted-foreground">Aprovação imediata</p>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-14 justify-start"
                  onClick={() => handlePayment('boleto')}
                  disabled={loading}
                >
                  {loading && paymentMethod === 'boleto' ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="mr-3 h-5 w-5 text-primary" />
                  )}
                  <div className="text-left">
                    <p className="font-medium">Boleto Bancário</p>
                    <p className="text-xs text-muted-foreground">Até 3 dias úteis</p>
                  </div>
                </Button>
              </div>

              <div className="text-center pt-2">
                <button 
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={handleContactAdmin}
                >
                  Precisa de ajuda? Contate o administrador
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
