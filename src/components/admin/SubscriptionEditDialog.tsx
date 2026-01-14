import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
}

interface TenantWithSubscription {
  id: string;
  name: string;
  is_blocked: boolean;
  plan_id: string | null;
  plan_name: string | null;
  status: string | null;
  end_date: string | null;
  subscription_id: string | null;
}

interface SubscriptionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithSubscription | null;
  plans: Plan[];
  onSave: (tenantId: string, subscriptionId: string | null, planId: string, endDate: Date, status: string) => Promise<void>;
}

export function SubscriptionEditDialog({
  open,
  onOpenChange,
  tenant,
  plans,
  onSave,
}: SubscriptionEditDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [saving, setSaving] = useState(false);

  // Reset form when tenant changes
  useState(() => {
    if (tenant) {
      setSelectedPlan(tenant.plan_id || plans[0]?.id || '');
      setSelectedDate(tenant.end_date ? new Date(tenant.end_date) : new Date());
      setSelectedStatus(tenant.status || 'active');
    }
  });

  const handleSave = async () => {
    if (!tenant || !selectedPlan || !selectedDate) return;
    
    setSaving(true);
    try {
      await onSave(tenant.id, tenant.subscription_id, selectedPlan, selectedDate, selectedStatus);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Assinatura - {tenant.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plano</label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data de Vencimento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                  ) : (
                    'Selecione uma data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
