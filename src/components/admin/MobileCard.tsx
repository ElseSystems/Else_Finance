interface MobileCardItem {
  label: string;
  value: string | number | null;
}

interface MobileCardProps {
  title: string;
  items: MobileCardItem[];
  footer?: string;
}

export function MobileCard({ title, items, footer }: MobileCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm space-y-2">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm text-muted-foreground">
            <span>{item.label}</span>
            <span className="text-foreground font-medium">{item.value ?? '-'}</span>
          </div>
        ))}
      </div>
      {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}

