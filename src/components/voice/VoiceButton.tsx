import { useState } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function VoiceButton() {
  const [showPanel, setShowPanel] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const voiceCommands = [
    {
      phrase: 'criar centro de custo',
      action: async (params?: string) => {
        if (params && profile?.tenant_id) {
          const { error } = await supabase
            .from('cost_centers')
            .insert({
              tenant_id: profile.tenant_id,
              name: params,
              description: `Centro de custo criado por comando de voz`,
            });
          
          if (!error) {
            toast({
              title: 'Centro de custo criado!',
              description: `"${params}" foi adicionado com sucesso.`,
            });
          }
        } else {
          navigate('/cost-centers');
        }
      },
    },
    {
      phrase: 'criar despesa',
      action: () => {
        navigate('/transactions?type=expense&new=true');
      },
    },
    {
      phrase: 'criar receita',
      action: () => {
        navigate('/transactions?type=income&new=true');
      },
    },
    {
      phrase: 'ir para dashboard',
      action: () => {
        navigate('/dashboard');
      },
    },
    {
      phrase: 'ir para transações',
      action: () => {
        navigate('/transactions');
      },
    },
    {
      phrase: 'ir para centros de custo',
      action: () => {
        navigate('/cost-centers');
      },
    },
    {
      phrase: 'ir para plano de contas',
      action: () => {
        navigate('/chart-accounts');
      },
    },
  ];

  const { isListening, transcript, toggleListening, isSupported, stopListening } = useVoiceCommands({
    commands: voiceCommands,
    onTranscript: setCurrentTranscript,
  });

  const handleToggle = () => {
    if (!isListening) {
      setShowPanel(true);
    }
    toggleListening();
  };

  const handleClose = () => {
    stopListening();
    setShowPanel(false);
    setCurrentTranscript('');
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Voice Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'btn-voice fixed bottom-6 right-6 z-50',
          isListening && 'listening'
        )}
        aria-label={isListening ? 'Parar de ouvir' : 'Ativar comando de voz'}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {/* Voice Panel */}
      {showPanel && (
        <div className="fixed bottom-24 right-6 z-50 w-80 glass-card p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">
              Comando de Voz
            </h3>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="min-h-[60px] flex items-center justify-center">
            {isListening ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="w-1 h-4 bg-primary rounded-full animate-pulse" />
                  <span className="w-1 h-6 bg-primary rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-4 bg-primary rounded-full animate-pulse delay-150" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentTranscript || 'Ouvindo...'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão para ativar
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Comandos disponíveis:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• "Criar centro de custo [nome]"</li>
              <li>• "Criar despesa"</li>
              <li>• "Criar receita"</li>
              <li>• "Ir para dashboard"</li>
              <li>• "Ir para transações"</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
