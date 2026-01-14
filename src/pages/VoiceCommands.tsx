import { Layout } from '@/components/layout/Layout';
import { Mic, ArrowRight } from 'lucide-react';

const availableCommands = [
  {
    phrase: 'Criar receita [valor] descrição [texto] centro [nome] plano [nome]',
    description: 'Cria uma receita diretamente por voz com todos os parâmetros',
    example: '"Criar receita 500 reais descrição venda de produto centro geral plano vendas"',
    category: 'Transações',
  },
  {
    phrase: 'Criar despesa [valor] descrição [texto] centro [nome] plano [nome]',
    description: 'Cria uma despesa diretamente por voz com todos os parâmetros',
    example: '"Criar despesa 150 reais descrição material de escritório centro administrativo plano infraestrutura"',
    category: 'Transações',
  },
  {
    phrase: 'Nova receita [valor]',
    description: 'Atalho rápido para criar receita com valor',
    example: '"Nova receita 1000 reais"',
    category: 'Transações',
  },
  {
    phrase: 'Nova despesa [valor]',
    description: 'Atalho rápido para criar despesa com valor',
    example: '"Nova despesa 200 reais"',
    category: 'Transações',
  },
  {
    phrase: 'Lançar receita [valor] descrição [texto]',
    description: 'Lança uma receita com valor e descrição',
    example: '"Lançar receita 800 descrição consultoria"',
    category: 'Transações',
  },
  {
    phrase: 'Lançar despesa [valor] descrição [texto]',
    description: 'Lança uma despesa com valor e descrição',
    example: '"Lançar despesa 350 descrição aluguel"',
    category: 'Transações',
  },
  {
    phrase: 'Criar centro de custo [nome]',
    description: 'Cria um novo centro de custo com o nome especificado',
    example: '"Criar centro de custo restaurante"',
    category: 'Centros de Custo',
  },
  {
    phrase: 'Ir para dashboard',
    description: 'Navega para a página do dashboard',
    example: '"Ir para dashboard"',
    category: 'Navegação',
  },
  {
    phrase: 'Ir para transações',
    description: 'Navega para a página de transações',
    example: '"Ir para transações"',
    category: 'Navegação',
  },
  {
    phrase: 'Ir para centros de custo',
    description: 'Navega para a página de centros de custo',
    example: '"Ir para centros de custo"',
    category: 'Navegação',
  },
  {
    phrase: 'Ir para plano de contas',
    description: 'Navega para a página de plano de contas',
    example: '"Ir para plano de contas"',
    category: 'Navegação',
  },
  {
    phrase: 'Ir para configurações',
    description: 'Navega para a página de configurações',
    example: '"Ir para configurações"',
    category: 'Navegação',
  },
  {
    phrase: 'Ir para comandos de voz',
    description: 'Navega para esta página de ajuda',
    example: '"Ir para comandos de voz"',
    category: 'Navegação',
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

      {/* Available Commands by Category */}
      {['Transações', 'Centros de Custo', 'Navegação'].map((category) => (
        <div key={category} className="mb-8">
          <h2 className="font-display font-semibold text-xl mb-4">{category}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCommands
              .filter((cmd) => cmd.category === category)
              .map((command, index) => (
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
                      <p className="font-medium text-foreground mb-1 text-sm">"{command.phrase}"</p>
                      <p className="text-sm text-muted-foreground mb-2">{command.description}</p>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Exemplo: </span>
                        <code className="px-2 py-1 rounded bg-muted text-foreground break-all">
                          {command.example}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

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
