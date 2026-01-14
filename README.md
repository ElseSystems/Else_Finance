# FinanceApp - Sistema de Controle Financeiro

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Autenticação e Segurança](#autenticação-e-segurança)
6. [Telas e Funcionalidades](#telas-e-funcionalidades)
7. [Comandos de Voz](#comandos-de-voz)
8. [Sistema de Multi-Tenancy](#sistema-de-multi-tenancy)
9. [Instalação e Configuração](#instalação-e-configuração)
10. [Estrutura de Arquivos](#estrutura-de-arquivos)

---

## 🎯 Visão Geral

O **FinanceApp** é uma aplicação web completa de controle financeiro desenvolvida para empresas e profissionais autônomos. O sistema permite gerenciar receitas, despesas, centros de custo e plano de contas de forma intuitiva, incluindo funcionalidades avançadas como **comandos de voz** para agilizar o lançamento de transações.

### Principais Funcionalidades

- ✅ Dashboard com visão geral financeira
- ✅ Gerenciamento de transações (receitas e despesas)
- ✅ Centros de custo personalizáveis
- ✅ Plano de contas estruturado
- ✅ Comandos de voz para lançamentos rápidos
- ✅ Sistema multi-tenant (múltiplas empresas)
- ✅ Painel administrativo (acesso restrito)
- ✅ Autenticação segura com Supabase

---

## 🛠 Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18.3.1 | Biblioteca para construção de interfaces |
| TypeScript | - | Tipagem estática para JavaScript |
| Vite | - | Build tool e dev server |
| Tailwind CSS | - | Framework CSS utilitário |
| shadcn/ui | - | Componentes UI baseados em Radix |
| React Router DOM | 6.30.1 | Roteamento SPA |
| TanStack Query | 5.83.0 | Gerenciamento de estado servidor |
| Recharts | 2.15.4 | Gráficos e visualizações |
| date-fns | 3.6.0 | Manipulação de datas |
| Lucide React | 0.462.0 | Ícones |

### Backend (Supabase)
| Serviço | Descrição |
|---------|-----------|
| PostgreSQL | Banco de dados relacional |
| Auth | Autenticação e autorização |
| Row Level Security (RLS) | Segurança a nível de linha |
| Database Functions | Funções SQL customizadas |
| Triggers | Gatilhos automáticos |

---

## 🏗 Arquitetura do Sistema

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │  Components │  │    Hooks    │              │
│  │  - Auth     │  │  - Layout   │  │  - useAuth  │              │
│  │  - Dashboard│  │  - UI       │  │  - useVoice │              │
│  │  - Trans... │  │  - Voice    │  │  - useToast │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│                    Supabase Client SDK                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Supabase)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ PostgreSQL  │  │  Auth       │  │  Functions  │              │
│  │  - Tables   │  │  - Users    │  │  - has_role │              │
│  │  - RLS      │  │  - Sessions │  │  - triggers │              │
│  │  - Triggers │  │  - Tokens   │  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário** interage com a interface React
2. **Componentes** disparam ações via hooks customizados
3. **Supabase Client** faz requisições autenticadas
4. **RLS Policies** validam permissões no banco
5. **Dados** são retornados e exibidos na UI

---

## 🗄 Estrutura do Banco de Dados

### Diagrama ER (Entity-Relationship)

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   auth.users     │     │     profiles     │     │     tenants      │
│──────────────────│     │──────────────────│     │──────────────────│
│ id (PK)          │────▶│ user_id (FK)     │────▶│ id (PK)          │
│ email            │     │ tenant_id (FK)   │     │ name             │
│ encrypted_pass   │     │ full_name        │     │ created_by       │
│ created_at       │     │ email            │     │ is_blocked       │
└──────────────────┘     └──────────────────┘     │ block_reason     │
                                                   │ blocked_at       │
         ┌─────────────────────────────────────────┤ created_at       │
         │                                         └──────────────────┘
         │                                                    │
         ▼                                                    │
┌──────────────────┐     ┌──────────────────┐                │
│   user_roles     │     │   transactions   │◀───────────────┘
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │     ┌──────────────────┐
│ user_id (FK)     │     │ tenant_id (FK)   │────▶│  cost_centers    │
│ role (enum)      │     │ type (enum)      │     │──────────────────│
│ - admin          │     │ description      │     │ id (PK)          │
│ - user           │     │ amount           │     │ tenant_id (FK)   │
└──────────────────┘     │ date             │     │ name             │
                         │ is_paid          │     │ description      │
                         │ cost_center_id   │     │ color            │
                         │ chart_account_id │     │ is_active        │
                         │ created_by       │     └──────────────────┘
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │chart_of_accounts │
                         │──────────────────│
                         │ id (PK)          │
                         │ tenant_id (FK)   │
                         │ code             │
                         │ name             │
                         │ type (enum)      │
                         │ - income         │
                         │ - expense        │
                         │ parent_id (FK)   │
                         │ is_active        │
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      plans       │     │  subscriptions   │     │    payments      │
│──────────────────│     │──────────────────│     │──────────────────│
│ id (PK)          │◀────│ plan_id (FK)     │◀────│ subscription_id  │
│ name             │     │ tenant_id (FK)   │     │ tenant_id (FK)   │
│ description      │     │ status           │     │ amount           │
│ price            │     │ start_date       │     │ status           │
│ duration_months  │     │ end_date         │     │ payment_method   │
│ is_active        │     │ is_trial         │     │ paid_at          │
└──────────────────┘     │ trial_ends_at    │     │ mercadopago_id   │
                         │ amount_due       │     └──────────────────┘
                         └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  voice_commands  │     │ payment_methods  │
│──────────────────│     │──────────────────│
│ id (PK)          │     │ id (PK)          │
│ tenant_id (FK)   │     │ tenant_id (FK)   │
│ phrase           │     │ type             │
│ action           │     │ card_last_four   │
│ parameters       │     │ card_brand       │
│ is_active        │     │ is_default       │
└──────────────────┘     │ mercadopago_id   │
                         └──────────────────┘
```

### Descrição das Tabelas

#### `profiles`
Armazena informações adicionais do usuário vinculadas ao `auth.users`.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | Referência ao auth.users |
| tenant_id | UUID | Empresa/organização do usuário |
| full_name | TEXT | Nome completo |
| email | TEXT | E-mail do usuário |

#### `tenants`
Representa empresas/organizações no sistema multi-tenant.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome da empresa |
| created_by | UUID | Usuário que criou |
| is_blocked | BOOLEAN | Se o tenant está bloqueado |
| block_reason | TEXT | Motivo do bloqueio |
| blocked_at | TIMESTAMP | Data do bloqueio |

#### `user_roles`
Gerencia permissões de usuários (admin, user).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | Referência ao auth.users |
| role | app_role | Enum: 'admin' ou 'user' |

#### `transactions`
Transações financeiras (receitas e despesas).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| tenant_id | UUID | Empresa proprietária |
| type | transaction_type | 'income' ou 'expense' |
| description | TEXT | Descrição da transação |
| amount | NUMERIC | Valor |
| date | DATE | Data da transação |
| is_paid | BOOLEAN | Se foi pago/recebido |
| cost_center_id | UUID | Centro de custo |
| chart_account_id | UUID | Conta do plano de contas |
| created_by | UUID | Usuário que criou |

#### `cost_centers`
Centros de custo para categorização de despesas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| tenant_id | UUID | Empresa proprietária |
| name | TEXT | Nome do centro |
| description | TEXT | Descrição |
| color | TEXT | Cor hexadecimal |
| is_active | BOOLEAN | Se está ativo |

#### `chart_of_accounts`
Plano de contas estruturado.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| tenant_id | UUID | Empresa proprietária |
| code | TEXT | Código hierárquico (ex: 1.1) |
| name | TEXT | Nome da conta |
| type | transaction_type | 'income' ou 'expense' |
| parent_id | UUID | Conta pai (hierarquia) |
| is_active | BOOLEAN | Se está ativa |

#### `plans`
Planos de assinatura disponíveis.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| name | TEXT | Nome do plano |
| description | TEXT | Descrição |
| price | NUMERIC | Preço |
| duration_months | INTEGER | Duração em meses |
| is_active | BOOLEAN | Se está disponível |

#### `subscriptions`
Assinaturas dos tenants aos planos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| tenant_id | UUID | Empresa assinante |
| plan_id | UUID | Plano contratado |
| status | TEXT | 'active', 'trial', 'expired' |
| start_date | DATE | Início da assinatura |
| end_date | DATE | Fim da assinatura |
| is_trial | BOOLEAN | Se é período de teste |
| trial_ends_at | DATE | Fim do trial |

### Funções do Banco de Dados

#### `has_role(_user_id, _role)`
Verifica se um usuário possui determinada role.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Uso:** Usado em RLS policies para verificar permissões de admin.

#### `get_user_tenant_id(_user_id)`
Retorna o tenant_id do usuário.

```sql
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;
```

**Uso:** Isolamento de dados por tenant nas RLS policies.

#### `handle_new_user()`
Trigger que executa ao criar novo usuário:
1. Cria um novo tenant
2. Cria o profile do usuário
3. Atribui role 'user'
4. Cria centros de custo padrão
5. Cria plano de contas padrão
6. Cria assinatura trial de 30 dias

#### `check_tenant_access(p_tenant_id)`
Verifica se um tenant pode acessar o sistema (não bloqueado, assinatura válida).

---

## 🔐 Autenticação e Segurança

### Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO DE LOGIN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuário acessa /auth                                        │
│         │                                                        │
│         ▼                                                        │
│  2. Preenche e-mail e senha                                     │
│         │                                                        │
│         ▼                                                        │
│  3. signIn() → supabase.auth.signInWithPassword()               │
│         │                                                        │
│         ▼                                                        │
│  4. Supabase valida credenciais                                 │
│         │                                                        │
│         ├── ❌ Erro → Exibe mensagem de erro                    │
│         │                                                        │
│         └── ✅ Sucesso                                          │
│                 │                                                │
│                 ▼                                                │
│  5. Session armazenada no localStorage                          │
│         │                                                        │
│         ▼                                                        │
│  6. AuthProvider atualiza estado (user, session, profile)       │
│         │                                                        │
│         ▼                                                        │
│  7. Redireciona para /dashboard                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado. As principais policies são:

#### Transactions
```sql
-- Usuários só veem transações do seu tenant
CREATE POLICY "Users can view tenant transactions"
ON public.transactions FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Usuários só gerenciam transações do seu tenant
CREATE POLICY "Users can manage tenant transactions"
ON public.transactions FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()));
```

#### Tenants
```sql
-- Admins podem gerenciar todos os tenants
CREATE POLICY "Admins can manage all tenants"
ON public.tenants FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Usuários só veem seu próprio tenant
CREATE POLICY "Users can view own tenant"
ON public.tenants FOR SELECT
USING (id = get_user_tenant_id(auth.uid()));
```

### Verificação de Admin

O painel administrativo (`/admin`) verifica a role do usuário:

```typescript
const checkAdminRole = async () => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  setIsAdmin(!error && data?.role === 'admin');
};
```

---

## 📱 Telas e Funcionalidades

### 1. Tela de Autenticação (`/auth`)

**Arquivo:** `src/pages/Auth.tsx`

#### Layout
- Lado esquerdo: Formulário de login/cadastro
- Lado direito: Branding e informações do app (desktop)

#### Funcionalidades

| Elemento | Ação | Descrição |
|----------|------|-----------|
| Campos de texto | Input | E-mail, senha, nome (cadastro) |
| Botão "Entrar" | Click | Faz login com credenciais |
| Botão "Criar conta" | Click | Registra novo usuário |
| Link toggle | Click | Alterna entre login/cadastro |

#### Fluxo de Cadastro
1. Usuário preenche nome, e-mail e senha
2. `signUp()` cria usuário no Supabase Auth
3. Trigger `handle_new_user()` executa automaticamente:
   - Cria tenant com nome do usuário
   - Cria profile vinculado ao tenant
   - Atribui role 'user'
   - Cria dados iniciais (centros de custo, plano de contas)
   - Cria assinatura trial de 30 dias

---

### 2. Dashboard (`/dashboard`)

**Arquivo:** `src/pages/Dashboard.tsx`

#### Cards de Estatísticas

| Card | Descrição | Cálculo |
|------|-----------|---------|
| Saldo Total | Balanço do mês | Receitas - Despesas |
| Receitas do Mês | Total de entradas | Soma de transações type='income' |
| Despesas do Mês | Total de saídas | Soma de transações type='expense' |
| Economia | Valor economizado | Receitas - Despesas |

#### Indicadores de Tendência
- Compara mês atual com mês anterior
- Verde ↑ = melhoria
- Vermelho ↓ = piora

#### Gráficos

| Gráfico | Tipo | Dados |
|---------|------|-------|
| TransactionChart | Área | Receitas vs Despesas por dia |
| CostCenterChart | Pizza | Distribuição de despesas por centro |

#### Transações Recentes
Lista as últimas 5 transações com:
- Ícone (entrada/saída)
- Descrição
- Data
- Centro de custo (badge colorido)
- Valor

---

### 3. Transações (`/transactions`)

**Arquivo:** `src/pages/Transactions.tsx`

#### Listagem

| Elemento | Funcionalidade |
|----------|----------------|
| Barra de busca | Filtra por descrição ou centro de custo |
| Select de tipo | Filtra: Todos, Receitas, Despesas |
| Lista de transações | Exibe todas as transações ordenadas por data |
| Botão excluir | Remove transação (hover) |

#### Modal "Nova Transação"

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| Tipo | Toggle | Sim | Receita ou Despesa |
| Descrição | Text | Sim | Descrição da transação |
| Valor | Number | Sim | Valor em reais |
| Data | Date | Sim | Data da transação |
| Centro de Custo | Select | Não | Vincula a um centro |
| Plano de Contas | Select | Não | Vincula a uma conta |
| Pago/Recebido | Checkbox | Não | Status do pagamento |

#### Ações

| Botão | Ação | Resultado |
|-------|------|-----------|
| "Nova Transação" | Abre modal | Formulário de criação |
| "Criar Transação" | Submit | Insere no banco e fecha modal |
| Lixeira (hover) | Delete | Remove transação após confirmação |

---

### 4. Centros de Custo (`/cost-centers`)

**Arquivo:** `src/pages/CostCenters.tsx`

#### Listagem em Grid
Cada card exibe:
- Ícone colorido
- Nome do centro
- Descrição (se houver)
- Botões editar/excluir (hover)

#### Modal de Criação/Edição

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Text | Nome do centro de custo |
| Descrição | Text | Descrição opcional |
| Cor | Palette | Seletor de 10 cores predefinidas |

#### Cores Disponíveis
```javascript
['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6',
 '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16']
```

---

### 5. Plano de Contas (`/chart-accounts`)

**Arquivo:** `src/pages/ChartAccounts.tsx`

#### Layout
- Coluna esquerda: Contas de Receita
- Coluna direita: Contas de Despesa

#### Card de Conta
- Ícone (seta para cima = receita, para baixo = despesa)
- Código + Nome (ex: "1.1 - Vendas")
- Botões editar/excluir (hover)

#### Modal de Criação/Edição

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Tipo | Toggle | Receita ou Despesa |
| Código | Text | Código hierárquico (ex: 2.1.3) |
| Nome | Text | Nome da conta |

---

### 6. Configurações (`/settings`)

**Arquivo:** `src/pages/Settings.tsx`

#### Seção Perfil

| Campo | Editável | Descrição |
|-------|----------|-----------|
| Nome completo | ✅ | Nome do usuário |
| E-mail | ❌ | E-mail (read-only) |

#### Seção Empresa

| Campo | Editável | Descrição |
|-------|----------|-----------|
| Nome da empresa | ✅ | Nome do tenant |
| ID do Tenant | ❌ | UUID (read-only) |

---

### 7. Comandos de Voz (`/voice-commands`)

**Arquivo:** `src/pages/VoiceCommands.tsx`

Página de documentação dos comandos de voz disponíveis.

#### Seções
- **Como usar:** Instruções passo a passo
- **Transações:** Comandos para criar receitas/despesas
- **Centros de Custo:** Comandos para criar centros
- **Navegação:** Comandos para navegar entre telas
- **Dicas:** Melhores práticas para reconhecimento

---

### 8. Painel Admin (`/admin`)

**Arquivo:** `src/pages/Admin.tsx`

⚠️ **Acesso restrito:** Apenas usuários com role 'admin' podem acessar.

#### Estatísticas

| Card | Descrição |
|------|-----------|
| Total de Usuários | Contagem de profiles |
| Total de Tenants | Contagem de empresas |
| Total de Transações | Contagem de transações |

#### Lista de Usuários
Tabela com os 20 usuários mais recentes:

| Coluna | Descrição |
|--------|-----------|
| Nome | Nome completo |
| E-mail | E-mail do usuário |
| Empresa | Nome do tenant |
| Função | Badge admin/user |

---

## 🎤 Comandos de Voz

### Como Funciona

O sistema utiliza a **Web Speech API** para reconhecimento de voz em português brasileiro.

#### Componentes Envolvidos

1. **VoiceButton** (`src/components/voice/VoiceButton.tsx`)
   - Botão flutuante no canto inferior direito
   - Painel com feedback de escuta
   - Processa comandos e executa ações

2. **useVoiceCommands** (`src/hooks/useVoiceCommands.tsx`)
   - Hook customizado para reconhecimento de voz
   - Gerencia estado de escuta
   - Processa transcrição e identifica comandos

### Lista Completa de Comandos

#### Transações

| Comando | Exemplo | Ação |
|---------|---------|------|
| "Criar receita [valor] descrição [texto] centro [nome] plano [nome]" | "Criar receita 500 reais descrição venda de produto centro geral plano vendas" | Cria receita completa |
| "Criar despesa [valor] descrição [texto] centro [nome] plano [nome]" | "Criar despesa 150 descrição material de escritório centro administrativo" | Cria despesa completa |
| "Nova receita [valor]" | "Nova receita 1000 reais" | Atalho rápido para receita |
| "Nova despesa [valor]" | "Nova despesa 200 reais" | Atalho rápido para despesa |
| "Lançar receita [valor] descrição [texto]" | "Lançar receita 800 descrição consultoria" | Receita com descrição |
| "Lançar despesa [valor] descrição [texto]" | "Lançar despesa 350 descrição aluguel" | Despesa com descrição |

#### Centros de Custo

| Comando | Exemplo | Ação |
|---------|---------|------|
| "Criar centro de custo [nome]" | "Criar centro de custo restaurante" | Cria novo centro |

#### Navegação

| Comando | Destino |
|---------|---------|
| "Ir para dashboard" | /dashboard |
| "Ir para transações" | /transactions |
| "Ir para centros de custo" | /cost-centers |
| "Ir para plano de contas" | /chart-accounts |
| "Ir para configurações" | /settings |
| "Ir para comandos de voz" | /voice-commands |

### Parser de Comandos

O sistema extrai automaticamente:

| Parâmetro | Padrão de Reconhecimento | Exemplo |
|-----------|-------------------------|---------|
| Valor | `\d+[.,]?\d*\s*(reais\|real)?` | "500 reais", "1500,50" |
| Descrição | `descrição\s+(.+?)(?:centro\|plano\|data\|$)` | "descrição pagamento fornecedor" |
| Centro de Custo | `centro\s+(\w+)` | "centro administrativo" |
| Plano de Contas | `plano\s+(\w+)` | "plano infraestrutura" |
| Data | `data\s+(hoje\|amanhã\|\d{1,2}[\/\-]\d{1,2})` | "data amanhã", "data 15/01" |

---

## 🏢 Sistema de Multi-Tenancy

### Conceito

O FinanceApp implementa **multi-tenancy baseado em linha** (row-based). Cada registro no banco possui um `tenant_id` que identifica a qual empresa/organização pertence.

### Isolamento de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                         BANCO DE DADOS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tenant A (Empresa ABC)          Tenant B (Empresa XYZ)         │
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │ Transações          │         │ Transações          │        │
│  │ Centros de Custo    │         │ Centros de Custo    │        │
│  │ Plano de Contas     │         │ Plano de Contas     │        │
│  │ Usuários            │         │ Usuários            │        │
│  │ Assinatura          │         │ Assinatura          │        │
│  └─────────────────────┘         └─────────────────────┘        │
│                                                                  │
│  ◄───────────── RLS garante isolamento total ─────────────►    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Acesso

1. Usuário faz login
2. `AuthProvider` carrega profile com `tenant_id`
3. Todas as queries usam `get_user_tenant_id(auth.uid())`
4. RLS filtra automaticamente por tenant

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Lovable Cloud (ou Supabase)

### Passos para Instalação Local

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre no diretório
cd financeapp

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

O arquivo `.env` é gerado automaticamente pelo Lovable Cloud:

```env
VITE_SUPABASE_URL=https://ffvdmkclblvdqnaiontz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=ffvdmkclblvdqnaiontz
```

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa linter |

---

## 📁 Estrutura de Arquivos

```
financeapp/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── CostCenterChart.tsx    # Gráfico pizza de centros
│   │   │   ├── RecentTransactions.tsx # Lista de transações recentes
│   │   │   ├── StatCard.tsx           # Card de estatística
│   │   │   └── TransactionChart.tsx   # Gráfico de área temporal
│   │   ├── layout/
│   │   │   ├── Layout.tsx             # Layout principal com sidebar
│   │   │   └── Sidebar.tsx            # Menu lateral navegação
│   │   ├── ui/                        # Componentes shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ... (outros)
│   │   └── voice/
│   │       └── VoiceButton.tsx        # Botão flutuante de voz
│   ├── hooks/
│   │   ├── use-mobile.tsx             # Detecção de mobile
│   │   ├── use-toast.ts               # Hook de notificações
│   │   ├── useAuth.tsx                # Contexto de autenticação
│   │   └── useVoiceCommands.tsx       # Reconhecimento de voz
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts              # Cliente Supabase (auto-gerado)
│   │       └── types.ts               # Tipos TypeScript (auto-gerado)
│   ├── lib/
│   │   └── utils.ts                   # Utilitários (cn, etc)
│   ├── pages/
│   │   ├── Admin.tsx                  # Painel administrativo
│   │   ├── Auth.tsx                   # Login e cadastro
│   │   ├── ChartAccounts.tsx          # Plano de contas
│   │   ├── CostCenters.tsx            # Centros de custo
│   │   ├── Dashboard.tsx              # Dashboard principal
│   │   ├── Index.tsx                  # Página inicial (redirect)
│   │   ├── NotFound.tsx               # Página 404
│   │   ├── Settings.tsx               # Configurações
│   │   ├── Transactions.tsx           # Gerenciamento de transações
│   │   └── VoiceCommands.tsx          # Documentação de voz
│   ├── App.tsx                        # Componente raiz e rotas
│   ├── App.css                        # Estilos globais
│   ├── index.css                      # Variáveis CSS e Tailwind
│   └── main.tsx                       # Ponto de entrada
├── supabase/
│   ├── config.toml                    # Configuração Supabase
│   └── migrations/                    # Migrações SQL
├── .env                               # Variáveis de ambiente (auto-gerado)
├── index.html                         # HTML principal
├── package.json                       # Dependências
├── tailwind.config.ts                 # Configuração Tailwind
├── tsconfig.json                      # Configuração TypeScript
└── vite.config.ts                     # Configuração Vite
```

---

## 📝 Notas Adicionais

### Design System

O app utiliza tokens CSS customizados definidos em `src/index.css`:

- **Cores semânticas:** `--primary`, `--income`, `--expense`, `--destructive`
- **Sidebar:** Cores separadas para o menu lateral
- **Gradientes:** `--gradient-primary`, `--gradient-card`
- **Sombras:** `--shadow-sm` até `--shadow-glow`

### Fontes

- **Display (títulos):** Space Grotesk
- **Body (texto):** Inter

### Animações

- `fadeIn`: Entrada suave de elementos
- `slideInLeft`: Entrada do menu
- `pulse-ring`: Efeito do botão de voz

---

## 🔗 URLs do Projeto

- **Preview:** https://id-preview--043d4e40-1ff2-41d8-aa97-f810d6c47283.lovable.app
- **Produção:** https://voice-cash-flow-51.lovable.app

---

## 📄 Licença

Este projeto foi desenvolvido usando [Lovable](https://lovable.dev).

---

*Documentação gerada automaticamente. Última atualização: Janeiro 2026*
