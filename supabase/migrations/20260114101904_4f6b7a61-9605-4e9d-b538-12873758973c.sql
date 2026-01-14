
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    tenant_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Tenants table for multi-tenant support
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cost centers table
CREATE TABLE public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#10B981',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chart of accounts (plano de contas)
CREATE TABLE public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    cost_center_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
    chart_account_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_paid BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voice commands configuration table
CREATE TABLE public.voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    phrase TEXT NOT NULL,
    action TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tenants RLS policies
CREATE POLICY "Users can view own tenant" ON public.tenants FOR SELECT USING (id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can manage all tenants" ON public.tenants FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create tenant" ON public.tenants FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Cost centers RLS policies
CREATE POLICY "Users can view tenant cost centers" ON public.cost_centers FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can manage tenant cost centers" ON public.cost_centers FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Chart of accounts RLS policies
CREATE POLICY "Users can view tenant chart accounts" ON public.chart_of_accounts FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can manage tenant chart accounts" ON public.chart_of_accounts FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Transactions RLS policies
CREATE POLICY "Users can view tenant transactions" ON public.transactions FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can manage tenant transactions" ON public.transactions FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Voice commands RLS policies
CREATE POLICY "Users can view tenant voice commands" ON public.voice_commands FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can manage tenant voice commands" ON public.voice_commands FOR ALL USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chart_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile and tenant on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_tenant_id UUID;
BEGIN
    -- Create a new tenant for the user
    INSERT INTO public.tenants (name, created_by)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', 'Minha Empresa'), NEW.id)
    RETURNING id INTO new_tenant_id;
    
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email, tenant_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, new_tenant_id);
    
    -- Assign user role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    -- Create default cost centers
    INSERT INTO public.cost_centers (tenant_id, name, description, color) VALUES
    (new_tenant_id, 'Geral', 'Centro de custo padrão', '#6366F1'),
    (new_tenant_id, 'Operacional', 'Custos operacionais', '#10B981'),
    (new_tenant_id, 'Administrativo', 'Custos administrativos', '#F59E0B');
    
    -- Create default chart of accounts
    INSERT INTO public.chart_of_accounts (tenant_id, code, name, type) VALUES
    (new_tenant_id, '1', 'Receitas', 'income'),
    (new_tenant_id, '1.1', 'Vendas', 'income'),
    (new_tenant_id, '1.2', 'Serviços', 'income'),
    (new_tenant_id, '2', 'Despesas', 'expense'),
    (new_tenant_id, '2.1', 'Pessoal', 'expense'),
    (new_tenant_id, '2.2', 'Infraestrutura', 'expense'),
    (new_tenant_id, '2.3', 'Marketing', 'expense');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
