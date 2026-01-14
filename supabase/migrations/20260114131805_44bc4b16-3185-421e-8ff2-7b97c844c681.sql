-- Add blocking and trial fields to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add trial and payment tracking to subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_ends_at DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS amount_due NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_date DATE DEFAULT NULL;

-- Update handle_new_user to create 30-day trial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_tenant_id UUID;
    default_plan_id UUID;
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
    
    -- Get the cheapest active plan for trial
    SELECT id INTO default_plan_id FROM public.plans WHERE is_active = true ORDER BY price ASC LIMIT 1;
    
    -- Create 30-day trial subscription if a plan exists
    IF default_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (tenant_id, plan_id, status, start_date, end_date, is_trial, trial_ends_at)
        VALUES (new_tenant_id, default_plan_id, 'trial', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true, CURRENT_DATE + INTERVAL '30 days');
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Function to check if tenant is blocked or subscription expired
CREATE OR REPLACE FUNCTION public.check_tenant_access(p_tenant_id UUID)
RETURNS TABLE(
    can_access BOOLEAN,
    block_reason TEXT,
    is_payment_due BOOLEAN,
    amount_due NUMERIC,
    subscription_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_tenant RECORD;
    v_subscription RECORD;
BEGIN
    -- Get tenant info
    SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
    
    -- Get active subscription
    SELECT * INTO v_subscription 
    FROM public.subscriptions 
    WHERE tenant_id = p_tenant_id 
    AND (status = 'active' OR status = 'trial' OR status = 'expired')
    ORDER BY end_date DESC 
    LIMIT 1;
    
    -- Check if blocked manually
    IF v_tenant.is_blocked THEN
        RETURN QUERY SELECT 
            false::BOOLEAN, 
            COALESCE(v_tenant.block_reason, 'manual')::TEXT,
            false::BOOLEAN,
            0::NUMERIC,
            'blocked'::TEXT;
        RETURN;
    END IF;
    
    -- Check if subscription expired
    IF v_subscription IS NULL OR v_subscription.end_date < CURRENT_DATE THEN
        RETURN QUERY SELECT 
            false::BOOLEAN, 
            'payment_due'::TEXT,
            true::BOOLEAN,
            COALESCE(v_subscription.amount_due, 0)::NUMERIC,
            COALESCE(v_subscription.status, 'no_subscription')::TEXT;
        RETURN;
    END IF;
    
    -- Access granted
    RETURN QUERY SELECT 
        true::BOOLEAN, 
        NULL::TEXT,
        false::BOOLEAN,
        0::NUMERIC,
        v_subscription.status::TEXT;
END;
$function$;

-- Create payment_methods table for storing user payment preferences
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit_card', 'pix', 'boleto')),
    is_default BOOLEAN DEFAULT false,
    mercadopago_customer_id TEXT,
    mercadopago_card_id TEXT,
    card_last_four TEXT,
    card_brand TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_methods
CREATE POLICY "Users can view own payment methods"
ON public.payment_methods
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage own payment methods"
ON public.payment_methods
FOR ALL
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Admins can view all payment methods
CREATE POLICY "Admins can view all payment methods"
ON public.payment_methods
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant ON public.payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_blocked ON public.tenants(is_blocked);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);