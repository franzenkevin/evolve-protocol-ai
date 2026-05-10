
-- 1) Coupons: remove broad SELECT for authenticated users; expose validation via RPC
DROP POLICY IF EXISTS "Authenticated view active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text)
RETURNS TABLE (code text, discount_percent integer, valid_until timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code, c.discount_percent, c.valid_until
  FROM public.coupons c
  WHERE c.code = _code
    AND c.active = true
    AND (c.valid_until IS NULL OR c.valid_until > now())
    AND (c.max_uses IS NULL OR c.uses_count < c.max_uses)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO authenticated;

-- 2) Live meetings: restrict to active subscribers (admins still bypass via separate policy if needed)
DROP POLICY IF EXISTS "Authenticated users can view meetings" ON public.live_meetings;

CREATE POLICY "Subscribers and admins can view meetings"
ON public.live_meetings
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_active_subscription(auth.uid(), NULL)
);

-- 3) user_roles: explicit RESTRICTIVE policy preventing non-admin inserts (defense-in-depth)
CREATE POLICY "Block non-admin role inserts"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) protocol_regenerations: explicit restrictive policy blocking user inserts
CREATE POLICY "Block user inserts on regenerations"
ON public.protocol_regenerations
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- 5) Lock down internal SECURITY DEFINER helpers so anon/authenticated cannot invoke them via PostgREST
REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_user_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_journal_article() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_self_admin_promotion() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_referral_sensitive_fields() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;

-- 6) Ensure search_path is set on all SECURITY DEFINER helpers (fixes mutable search_path warning)
ALTER FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) SET search_path = public;
ALTER FUNCTION public.create_user_referral_code() SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.generate_referral_code() SET search_path = public;
ALTER FUNCTION public.get_admin_metrics() SET search_path = public;
ALTER FUNCTION public.get_ai_health_metrics() SET search_path = public;
ALTER FUNCTION public.get_monthly_ranking(date) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_active_subscription(uuid, text) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.notify_new_journal_article() SET search_path = public;
ALTER FUNCTION public.prevent_self_admin_promotion() SET search_path = public;
ALTER FUNCTION public.protect_referral_sensitive_fields() SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
