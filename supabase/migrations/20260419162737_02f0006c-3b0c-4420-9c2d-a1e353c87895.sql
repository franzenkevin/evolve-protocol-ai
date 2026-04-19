-- Remove duplicate paddle_subscription_id rows (keep most recently updated)
DELETE FROM public.subscriptions a
USING public.subscriptions b
WHERE a.paddle_subscription_id IS NOT NULL
  AND a.paddle_subscription_id = b.paddle_subscription_id
  AND a.ctid < b.ctid;

-- Add unique constraint required for ON CONFLICT upserts
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_paddle_subscription_id_key
  UNIQUE (paddle_subscription_id);