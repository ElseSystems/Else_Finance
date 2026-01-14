import { Layout } from '@/components/layout/Layout';
import { Mic, ArrowRight } from 'lucide-react';

const availableCommands = [
  {
    phrase: 'Criar centro de custo [nome]',
    description: 'Cria um novo centro de custo com o nome especificado',
    example: '"Criar centro de custo restaurante"',
  },
  {
    phrase: 'Criar despesa',
    description: 'Abre o formulário para criar uma nova despesa',
    example: '"Criar despesa"',
  },
  {
    phrase: 'Criar receita',
    description: 'Abre o formulário para criar uma nova receita',
    example: '"Criar receita"',
  },
  {
    phrase: 'Ir para dashboard',
    description: 'Navega para a página do dashboard',
    example: '"Ir para dashboard"',
  },
  {
    phrase: 'Ir para transações',
    description: 'Navega para a página de transações',
    example: '"Ir para transações"',
  },
  {
    phrase: 'Ir para centros de custo',
    description: 'Navega para a página de centros de custo',
    example: '"Ir para centros de custo"',
  },
  {
    phrase: 'Ir para plano de contas',
    description: 'Navega para a página de plano de contas',
    example: '"Ir para plano de contas"',
  },
];

export default function VoiceCommands() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Comandos de Voz</h1>
        <p className="text-muted-foreground mt-1">
          Use sua voz para controlar o aplicativo de forma ágil
        </p>
      </div>

      {/* Instructions */}
      <div className="stat-card mb-8">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-xl bg-primary/10">
            <Mic className="text-primary" size={32} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg mb-2">Como usar</h3>
            <ol className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">1</span>
                <span>Clique no botão de microfone no canto inferior direito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">2</span>
                <span>Permita o acesso ao microfone quando solicitado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">3</span>
                <span>Fale um dos comandos disponíveis abaixo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">4</span>
                <span>O sistema reconhecerá o comando e executará a ação</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Available Commands */}
      <h2 className="font-display font-semibold text-xl mb-4">Comandos Disponíveis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableCommands.map((command, index) => (
          <div
            key={command.phrase}
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Mic size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">"{command.phrase}"</p>
                <p className="text-sm text-muted-foreground mb-2">{command.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Exemplo:</span>
                  <code className="px-2 py-1 rounded bg-muted text-foreground">
                    {command.example}
                  </code>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-8 p-6 rounded-xl border border-border bg-muted/30">
        <h3 className="font-display font-semibold text-lg mb-3">Dicas para melhor reconhecimento</h3>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-center gap-2">
            <ArrowRight size={16} className="text-primary flex-shrink-0" />
            Fale de forma clara e em velocidade normal
          </li>
          <li className="flex items-center gap-2">
            <ArrowRight size={16} className="text-primary flex-shrink-0" />
            Evite ruídos de fundo durante o reconhecimento
          </li>
          <li className="flex items-center gap-2">
            <ArrowRight size={16} className="text-primary flex-shrink-0" />
            Use as frases exatas ou similares aos comandos listados
          </li>
          <li className="flex items-center gap-2">
            <ArrowRight size={16} className="text-primary flex-shrink-0" />
            Para criar itens com nomes, diga o nome logo após a frase de comando
          </li>
        </ul>
      </div>
    </Layout>
  );
}
