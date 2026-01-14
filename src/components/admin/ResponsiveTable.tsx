import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
}

export function ResponsiveTable({ children }: ResponsiveTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border/50">
      {children}
    </div>
  );
}

