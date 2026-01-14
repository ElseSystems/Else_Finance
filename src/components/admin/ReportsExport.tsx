import { Button } from '@/components/ui/button';

interface ReportsExportProps {
  onExportPayments: () => void;
  onExportSubscriptions: () => void;
}

export function ReportsExport({ onExportPayments, onExportSubscriptions }: ReportsExportProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button variant="outline" onClick={onExportPayments}>
        Exportar Pagamentos (CSV)
      </Button>
      <Button variant="outline" onClick={onExportSubscriptions}>
        Exportar Assinaturas (CSV)
      </Button>
    </div>
  );
}

