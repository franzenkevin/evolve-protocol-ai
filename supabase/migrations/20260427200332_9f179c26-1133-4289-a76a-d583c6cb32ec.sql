-- 1. Tabela de log de uso da IA
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  latency_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_created ON public.ai_usage_log (user_id, created_at DESC);
CREATE INDEX idx_ai_usage_created ON public.ai_usage_log (created_at DESC);
CREATE INDEX idx_ai_usage_function_created ON public.ai_usage_log (function_name, created_at DESC);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own usage logs"
  ON public.ai_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own usage logs"
  ON public.ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all usage logs"
  ON public.ai_usage_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages usage logs"
  ON public.ai_usage_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Função de rate limit (chamada pelas edge functions)
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  _user_id UUID,
  _function_name TEXT DEFAULT 'chat',
  _per_hour INTEGER DEFAULT 10,
  _per_day INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hour_count INTEGER;
  v_day_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_hour_count
  FROM public.ai_usage_log
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND status = 'success'
    AND created_at >= now() - interval '1 hour';

  SELECT COUNT(*) INTO v_day_count
  FROM public.ai_usage_log
  WHERE user_id = _user_id
    AND function_name = _function_name
    AND status = 'success'
    AND created_at >= now() - interval '24 hours';

  RETURN jsonb_build_object(
    'allowed', (v_hour_count < _per_hour AND v_day_count < _per_day),
    'hour_count', v_hour_count,
    'day_count', v_day_count,
    'hour_limit', _per_hour,
    'day_limit', _per_day,
    'reason', CASE
      WHEN v_hour_count >= _per_hour THEN 'hourly_limit'
      WHEN v_day_count >= _per_day THEN 'daily_limit'
      ELSE NULL
    END
  );
END;
$$;

-- 3. Função de métricas de saúde da IA (admin)
CREATE OR REPLACE FUNCTION public.get_ai_health_metrics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_total_24h INTEGER;
  v_errors_24h INTEGER;
  v_avg_latency NUMERIC;
  v_p95_latency NUMERIC;
  v_active_users_24h INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_total_24h
  FROM public.ai_usage_log
  WHERE created_at >= now() - interval '24 hours';

  SELECT COUNT(*) INTO v_errors_24h
  FROM public.ai_usage_log
  WHERE created_at >= now() - interval '24 hours'
    AND status <> 'success';

  SELECT COALESCE(AVG(latency_ms), 0) INTO v_avg_latency
  FROM public.ai_usage_log
  WHERE created_at >= now() - interval '24 hours'
    AND latency_ms IS NOT NULL;

  SELECT COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) INTO v_p95_latency
  FROM public.ai_usage_log
  WHERE created_at >= now() - interval '24 hours'
    AND latency_ms IS NOT NULL;

  SELECT COUNT(DISTINCT user_id) INTO v_active_users_24h
  FROM public.ai_usage_log
  WHERE created_at >= now() - interval '24 hours';

  SELECT jsonb_build_object(
    'total_calls_24h', v_total_24h,
    'error_count_24h', v_errors_24h,
    'error_rate_pct', CASE WHEN v_total_24h > 0 THEN ROUND((v_errors_24h::numeric / v_total_24h) * 100, 2) ELSE 0 END,
    'avg_latency_ms', ROUND(v_avg_latency, 0),
    'p95_latency_ms', ROUND(v_p95_latency, 0),
    'active_users_24h', v_active_users_24h,
    'calls_by_function', (
      SELECT COALESCE(jsonb_object_agg(function_name, c), '{}'::jsonb)
      FROM (
        SELECT function_name, COUNT(*) c
        FROM public.ai_usage_log
        WHERE created_at >= now() - interval '24 hours'
        GROUP BY function_name
      ) t
    ),
    'errors_by_function', (
      SELECT COALESCE(jsonb_object_agg(function_name, c), '{}'::jsonb)
      FROM (
        SELECT function_name, COUNT(*) c
        FROM public.ai_usage_log
        WHERE created_at >= now() - interval '24 hours'
          AND status <> 'success'
        GROUP BY function_name
      ) t
    ),
    'rate_limited_24h', (
      SELECT COUNT(*) FROM public.ai_usage_log
      WHERE created_at >= now() - interval '24 hours' AND status = 'rate_limited'
    ),
    'hourly_volume_24h', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('hour', h, 'count', COALESCE(c.cnt, 0)) ORDER BY h), '[]'::jsonb)
      FROM generate_series(date_trunc('hour', now() - interval '23 hours'), date_trunc('hour', now()), interval '1 hour') h
      LEFT JOIN (
        SELECT date_trunc('hour', created_at) AS bucket, COUNT(*) AS cnt
        FROM public.ai_usage_log
        WHERE created_at >= now() - interval '24 hours'
        GROUP BY 1
      ) c ON c.bucket = h
    ),
    'top_users_24h', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'user_id', user_id,
        'full_name', full_name,
        'calls', calls,
        'errors', errors
      ) ORDER BY calls DESC), '[]'::jsonb)
      FROM (
        SELECT
          l.user_id,
          COALESCE(p.full_name, 'Sem nome') AS full_name,
          COUNT(*) AS calls,
          COUNT(*) FILTER (WHERE l.status <> 'success') AS errors
        FROM public.ai_usage_log l
        LEFT JOIN public.profiles p ON p.user_id = l.user_id
        WHERE l.created_at >= now() - interval '24 hours'
        GROUP BY l.user_id, p.full_name
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) t
    ),
    'recent_errors', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'function_name', function_name,
        'status', status,
        'error_message', error_message,
        'created_at', created_at
      ) ORDER BY created_at DESC), '[]'::jsonb)
      FROM (
        SELECT function_name, status, error_message, created_at
        FROM public.ai_usage_log
        WHERE created_at >= now() - interval '24 hours'
          AND status <> 'success'
        ORDER BY created_at DESC
        LIMIT 20
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;