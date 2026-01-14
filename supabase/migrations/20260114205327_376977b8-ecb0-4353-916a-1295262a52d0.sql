-- Remove a constraint antiga e adiciona uma nova com 'blocked'
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_status_check;

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'cancelled'::text, 'expired'::text, 'pending'::text, 'trial'::text, 'blocked'::text]));