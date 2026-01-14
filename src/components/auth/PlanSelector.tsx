import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
}

interface PlanSelectorProps {
  selectedPlanId: string | null;
  onSelect: (planId: string) => void;
}

export function PlanSelector({ selectedPlanId, onSelect }: PlanSelectorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (data) {
      setPlans(data);
      // Auto-select first plan
      if (data.length > 0 && !selectedPlanId) {
        onSelect(data[0].id);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Escolha seu plano (30 dias grátis para testar)
      </label>
      <div className="grid grid-cols-1 gap-3">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              className={cn(
                'relative p-4 rounded-lg border-2 text-left transition-all',
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <div className="flex items-baseline justify-between pr-8">
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{plan.duration_months === 1 ? 'mês' : `${plan.duration_months} meses`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Você terá 30 dias gratuitos. Após o período de teste, será cobrado conforme o plano escolhido.
      </p>
    </div>
  );
}
