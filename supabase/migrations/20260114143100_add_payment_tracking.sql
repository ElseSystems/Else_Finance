-- Add extended tracking fields for payments and subscriptions

-- Additional fields on payments for reconciliation
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS status_detail TEXT,
ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount NUMERIC DEFAULT 0;

-- Improve subscriptions tracking
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS next_billing_date DATE,
ADD COLUMN IF NOT EXISTS grace_days INTEGER DEFAULT 0;

-- Indexes for faster billing lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at);

