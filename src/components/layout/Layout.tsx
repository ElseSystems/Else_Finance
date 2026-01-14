import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { VoiceButton } from '@/components/voice/VoiceButton';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export function Layout({ children, isAdmin = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar isAdmin={isAdmin} />
      
      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      <VoiceButton />
    </div>
  );
}
