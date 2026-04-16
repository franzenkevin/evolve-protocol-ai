
-- ========== PACOTE C: Plans, Coupons, Refunds + métricas profundas ==========

-- 1. PLANS
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  price_brl numeric NOT NULL CHECK (price_brl >= 0),
  interval_months int NOT NULL CHECK (interval_months > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (active = true);
CREATE POLICY "Admins can view all plans" ON public.plans FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update plans" ON public.plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete plans" ON public.plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.plans (code,name,price_brl,interval_months) VALUES
  ('monthly','Mensal',97,1),
  ('quarterly','Trimestral',267,3),
  ('yearly','Anual',970,12);

-- 2. COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_percent int NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  max_uses int CHECK (max_uses IS NULL OR max_uses > 0),
  uses_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view active coupons" ON public.coupons FOR SELECT TO authenticated
  USING (active = true AND (valid_until IS NULL OR valid_until > now()));
CREATE POLICY "Admins view all coupons" ON public.coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND created_by = auth.uid());
CREATE POLICY "Admins update coupons" ON public.coupons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete coupons" ON public.coupons FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own redemption" ON public.coupon_redemptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. REFUND REQUESTS
CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  reason text NOT NULL,
  amount_brl numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','refunded')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own refund" ON public.refund_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own refunds" ON public.refund_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins view all refunds" ON public.refund_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update refunds" ON public.refund_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_refunds_updated_at BEFORE UPDATE ON public.refund_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_refunds_status_created ON public.refund_requests (status, created_at DESC);

-- 4. get_admin_metrics REWRITE (preserva campos existentes + adiciona profundos)
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  v_mrr numeric;
  v_ltv numeric;
  v_total_users int;
  v_onboarded int;
  v_active_subs int;
  v_canceled_30d int;
  v_active_30d_ago int;
  v_new_7d int;
  v_new_30d int;
  v_retained_7d int;
  v_retained_30d int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_onboarded FROM public.profiles WHERE onboarding_complete = true;
  SELECT COUNT(*) INTO v_active_subs FROM public.subscriptions WHERE status = 'active';

  -- MRR: soma assinaturas ativas * (price/interval_months)
  SELECT COALESCE(SUM(p.price_brl / NULLIF(p.interval_months,0)), 0) INTO v_mrr
  FROM public.subscriptions s JOIN public.plans p ON p.code = s.plan_type
  WHERE s.status = 'active';

  -- LTV médio: receita total estimada (todas subs * price total) / nº usuários únicos com sub
  SELECT COALESCE(
    SUM(p.price_brl) / NULLIF(COUNT(DISTINCT s.user_id),0), 0
  ) INTO v_ltv
  FROM public.subscriptions s JOIN public.plans p ON p.code = s.plan_type;

  -- Churn 30d
  SELECT COUNT(*) INTO v_canceled_30d FROM public.subscriptions
    WHERE status IN ('canceled','cancelled','inactive') AND updated_at >= now() - interval '30 days';
  SELECT COUNT(*) INTO v_active_30d_ago FROM public.subscriptions
    WHERE created_at <= now() - interval '30 days';

  -- Retenção
  SELECT COUNT(*) INTO v_new_7d FROM public.profiles WHERE created_at >= now() - interval '7 days';
  SELECT COUNT(*) INTO v_new_30d FROM public.profiles WHERE created_at >= now() - interval '30 days';
  SELECT COUNT(DISTINCT p.user_id) INTO v_retained_7d
    FROM public.profiles p
    WHERE p.created_at >= now() - interval '7 days'
      AND EXISTS (SELECT 1 FROM public.workout_logs w WHERE w.user_id = p.user_id AND w.session_date >= current_date - 7);
  SELECT COUNT(DISTINCT p.user_id) INTO v_retained_30d
    FROM public.profiles p
    WHERE p.created_at >= now() - interval '30 days'
      AND EXISTS (SELECT 1 FROM public.workout_logs w WHERE w.user_id = p.user_id AND w.session_date >= current_date - 30);

  SELECT jsonb_build_object(
    'total_users', v_total_users,
    'onboarded_users', v_onboarded,
    'new_users_30d', v_new_30d,
    'active_users_7d', (
      SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM public.workout_logs WHERE session_date >= current_date - 7
        UNION SELECT user_id FROM public.checkins WHERE created_at >= now() - interval '7 days'
        UNION SELECT user_id FROM public.daily_ratings WHERE rated_date >= current_date - 7
      ) s
    ),
    'total_protocols', (SELECT COUNT(*) FROM public.protocols),
    'total_workouts', (SELECT COUNT(*) FROM public.workout_logs),
    'total_checkins', (SELECT COUNT(*) FROM public.checkins),
    'active_subscriptions', v_active_subs,
    'subscriptions_by_plan', (
      SELECT COALESCE(jsonb_object_agg(plan_type, c), '{}'::jsonb)
      FROM (SELECT plan_type, COUNT(*) c FROM public.subscriptions WHERE status = 'active' GROUP BY plan_type) t
    ),
    'renewals_next_30d', (
      SELECT COUNT(*) FROM public.subscriptions
      WHERE status = 'active' AND next_billing_date BETWEEN current_date AND current_date + 30
    ),
    'mrr', ROUND(v_mrr::numeric, 2),
    'ltv_avg', ROUND(v_ltv::numeric, 2),
    'churn_30d_pct', CASE WHEN v_active_30d_ago > 0 THEN ROUND((v_canceled_30d::numeric / v_active_30d_ago) * 100, 2) ELSE 0 END,
    'conversion_rate_pct', CASE WHEN v_total_users > 0 THEN ROUND((v_onboarded::numeric / v_total_users) * 100, 2) ELSE 0 END,
    'retention_7d_pct', CASE WHEN v_new_7d > 0 THEN ROUND((v_retained_7d::numeric / v_new_7d) * 100, 2) ELSE 0 END,
    'retention_30d_pct', CASE WHEN v_new_30d > 0 THEN ROUND((v_retained_30d::numeric / v_new_30d) * 100, 2) ELSE 0 END,
    'pending_refunds', (SELECT COUNT(*) FROM public.refund_requests WHERE status = 'pending'),
    'active_coupons', (SELECT COUNT(*) FROM public.coupons WHERE active = true AND (valid_until IS NULL OR valid_until > now())),
    'daily_signups_30d', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d::date, 'count', COALESCE(c.cnt,0)) ORDER BY d), '[]'::jsonb)
      FROM generate_series(current_date - 29, current_date, interval '1 day') d
      LEFT JOIN (
        SELECT created_at::date AS day, COUNT(*) AS cnt
        FROM public.profiles WHERE created_at >= current_date - 29 GROUP BY 1
      ) c ON c.day = d::date
    )
  ) INTO result;

  RETURN result;
END;
$$;
