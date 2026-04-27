-- Revoga execução de anon em funções que não fazem sentido sem login
REVOKE EXECUTE ON FUNCTION public.get_admin_metrics() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_ai_health_metrics() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_health_metrics() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer, integer) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_monthly_ranking(date) FROM anon;

REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon;

-- Funções de trigger não devem ser chamáveis via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_user_referral_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_journal_article() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.protect_referral_sensitive_fields() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_self_admin_promotion() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;