ALTER TABLE public.subscriptions RENAME COLUMN paddle_subscription_id TO stripe_subscription_id;
ALTER TABLE public.subscriptions RENAME COLUMN paddle_customer_id TO stripe_customer_id;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_session_id text;

ALTER TABLE public.protocol_regenerations RENAME COLUMN paddle_transaction_id TO stripe_session_id;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);