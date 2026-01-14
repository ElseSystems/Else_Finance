import { useState, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CostCenter {
  id: string;
  name: string;
}

interface ChartAccount {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

// Helper function to parse voice command for transaction
function parseTransactionCommand(text: string): {
  amount?: number;
  description?: string;
  costCenterName?: string;
  chartAccountName?: string;
  date?: string;
} {
  const result: {
    amount?: number;
    description?: string;
    costCenterName?: string;
    chartAccountName?: string;
    date?: string;
  } = {};

  // Parse amount (e.g., "100", "100 reais", "R$ 100,50")
  const amountMatch = text.match(/(\d+[.,]?\d*)\s*(reais|real)?/i);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(',', '.'));
  }

  // Parse description (after "descrição" or "descricao")
  const descMatch = text.match(/(?:descrição|descricao|descricão)\s+(.+?)(?:\s+(?:centro|plano|data|valor|$))/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  // Parse cost center (after "centro de custo" or "centro")
  const costCenterMatch = text.match(/(?:centro de custo|centro)\s+(\w+)/i);
  if (costCenterMatch) {
    result.costCenterName = costCenterMatch[1].trim();
  }

  // Parse chart account (after "plano de conta" or "conta" or "plano")
  const chartAccountMatch = text.match(/(?:plano de conta|plano de contas|plano|conta)\s+(\w+)/i);
  if (chartAccountMatch) {
    result.chartAccountName = chartAccountMatch[1].trim();
  }

  // Parse date (e.g., "hoje", "amanhã", "dd/mm" or "dd-mm")
  const dateMatch = text.match(/data\s+(hoje|amanhã|amanha|\d{1,2}[\/\-]\d{1,2})/i);
  if (dateMatch) {
    const dateStr = dateMatch[1].toLowerCase();
    const today = new Date();
    
    if (dateStr === 'hoje') {
      result.date = today.toISOString().split('T')[0];
    } else if (dateStr === 'amanhã' || dateStr === 'amanha') {
      today.setDate(today.getDate() + 1);
      result.date = today.toISOString().split('T')[0];
    } else {
      const [day, month] = dateStr.split(/[\/\-]/);
      const year = today.getFullYear();
      result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } else {
    result.date = new Date().toISOString().split('T')[0];
  }

  return result;
}

export function VoiceButton() {
  const [showPanel, setShowPanel] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch cost centers and chart accounts for voice command matching
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.tenant_id) return;

      const [ccRes, caRes] = await Promise.all([
        supabase
          .from('cost_centers')
          .select('id, name')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true),
        supabase
          .from('chart_of_accounts')
          .select('id, name, type')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true),
      ]);

      if (ccRes.data) setCostCenters(ccRes.data);
      if (caRes.data) setChartAccounts(caRes.data as ChartAccount[]);
    };

    fetchData();
  }, [profile?.tenant_id]);

  const findCostCenter = (name: string) => {
    return costCenters.find(cc => 
      cc.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  const findChartAccount = (name: string, type: 'income' | 'expense') => {
    return chartAccounts.find(ca => 
      ca.name.toLowerCase().includes(name.toLowerCase()) && ca.type === type
    );
  };

  const createTransaction = async (type: 'income' | 'expense', params: string) => {
    if (!profile?.tenant_id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para criar transações.',
        variant: 'destructive',
      });
      return;
    }

    const parsed = parseTransactionCommand(params);

    if (!parsed.amount) {
      toast({
        title: 'Valor não reconhecido',
        description: 'Por favor, diga o valor da transação. Ex: "criar receita 100 reais descrição venda"',
        variant: 'destructive',
      });
      return;
    }

    const costCenter = parsed.costCenterName ? findCostCenter(parsed.costCenterName) : null;
    const chartAccount = parsed.chartAccountName ? findChartAccount(parsed.chartAccountName, type) : null;

    const { error } = await supabase.from('transactions').insert({
      tenant_id: profile.tenant_id,
      type,
      description: parsed.description || `${type === 'income' ? 'Receita' : 'Despesa'} via voz`,
      amount: parsed.amount,
      date: parsed.date || new Date().toISOString().split('T')[0],
      cost_center_id: costCenter?.id || null,
      chart_account_id: chartAccount?.id || null,
      is_paid: false,
      created_by: profile.user_id,
    });

    if (error) {
      toast({
        title: 'Erro ao criar transação',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      const details = [
        `Valor: R$ ${parsed.amount.toFixed(2)}`,
        parsed.description && `Descrição: ${parsed.description}`,
        costCenter && `Centro de custo: ${costCenter.name}`,
        chartAccount && `Plano: ${chartAccount.name}`,
      ].filter(Boolean).join(' | ');

      toast({
        title: `${type === 'income' ? 'Receita' : 'Despesa'} criada!`,
        description: details,
      });
    }
  };

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
      phrase: 'criar receita',
      action: async (params?: string) => {
        if (params && params.trim()) {
          await createTransaction('income', params);
        } else {
          navigate('/transactions?type=income&new=true');
        }
      },
    },
    {
      phrase: 'criar despesa',
      action: async (params?: string) => {
        if (params && params.trim()) {
          await createTransaction('expense', params);
        } else {
          navigate('/transactions?type=expense&new=true');
        }
      },
    },
    {
      phrase: 'nova receita',
      action: async (params?: string) => {
        if (params && params.trim()) {
          await createTransaction('income', params);
        } else {
          navigate('/transactions?type=income&new=true');
        }
      },
    },
    {
      phrase: 'nova despesa',
      action: async (params?: string) => {
        if (params && params.trim()) {
          await createTransaction('expense', params);
        } else {
          navigate('/transactions?type=expense&new=true');
        }
      },
    },
    {
      phrase: 'lançar receita',
      action: async (params?: string) => {
        if (params && params.trim()) {
          await createTransaction('income', params);
        } else {
          navigate('/transactions?type=income&new=true');
        }
      },
    },
    {
      phrase: 'lançar despesa',
      action: async (params?: string) => {
        if (params && params.trim()) {
          await createTransaction('expense', params);
        } else {
          navigate('/transactions?type=expense&new=true');
        }
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
    {
      phrase: 'ir para configurações',
      action: () => {
        navigate('/settings');
      },
    },
    {
      phrase: 'ir para comandos de voz',
      action: () => {
        navigate('/voice-commands');
      },
    },
  ];

  const { isListening, toggleListening, isSupported, stopListening } = useVoiceCommands({
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
            <ul className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
              <li>• "Criar receita [valor] descrição [texto]"</li>
              <li>• "Criar despesa [valor] descrição [texto]"</li>
              <li>• "Criar centro de custo [nome]"</li>
              <li>• "Ir para dashboard"</li>
              <li>• "Ir para transações"</li>
              <li>• "Ir para configurações"</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
