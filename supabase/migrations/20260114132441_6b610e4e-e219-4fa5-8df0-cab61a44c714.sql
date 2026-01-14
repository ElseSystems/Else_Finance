-- Drop the existing check constraint and recreate with 'trial' status
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'pending', 'trial'));