-- 1. Expand journal_articles with content fields
ALTER TABLE public.journal_articles
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS read_time_minutes integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS author text DEFAULT 'Equipe Hypertrophy';

-- 2. Function to compute monthly ranking (privacy-safe: returns nickname + counts)
CREATE OR REPLACE FUNCTION public.get_monthly_ranking(
  _month_start date DEFAULT date_trunc('month', CURRENT_DATE)::date
)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  nickname text,
  avatar_url text,
  checkins_count integer,
  workouts_count integer,
  total_score integer,
  is_current_user boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH month_window AS (
    SELECT _month_start AS start_d, (_month_start + interval '1 month')::date AS end_d
  ),
  checkin_stats AS (
    SELECT c.user_id, COUNT(*)::int AS cnt
    FROM public.checkins c, month_window m
    WHERE c.created_at >= m.start_d AND c.created_at < m.end_d
      AND c.adherence IS NOT NULL
    GROUP BY c.user_id
  ),
  workout_stats AS (
    SELECT w.user_id, COUNT(DISTINCT w.session_date)::int AS cnt
    FROM public.workout_logs w, month_window m
    WHERE w.session_date >= m.start_d AND w.session_date < m.end_d
    GROUP BY w.user_id
  ),
  combined AS (
    SELECT
      p.user_id,
      COALESCE(NULLIF(split_part(p.full_name, ' ', 1), ''), 'Atleta') AS first_name,
      p.full_name,
      p.avatar_url,
      COALESCE(cs.cnt, 0) AS checkins_cnt,
      COALESCE(ws.cnt, 0) AS workouts_cnt,
      (COALESCE(cs.cnt, 0) + COALESCE(ws.cnt, 0) * 2) AS score
    FROM public.profiles p
    LEFT JOIN checkin_stats cs ON cs.user_id = p.user_id
    LEFT JOIN workout_stats ws ON ws.user_id = p.user_id
    WHERE COALESCE(cs.cnt, 0) + COALESCE(ws.cnt, 0) > 0
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY c.score DESC, c.workouts_cnt DESC)::int AS rank,
    c.user_id,
    -- Nickname: first name + first letter of last name (e.g., "João S.")
    CASE
      WHEN c.full_name IS NULL OR c.full_name = '' THEN 'Atleta'
      WHEN array_length(string_to_array(c.full_name, ' '), 1) > 1
        THEN c.first_name || ' ' || left(split_part(c.full_name, ' ', array_length(string_to_array(c.full_name, ' '), 1)), 1) || '.'
      ELSE c.first_name
    END AS nickname,
    c.avatar_url,
    c.checkins_cnt,
    c.workouts_cnt,
    c.score AS total_score,
    (c.user_id = auth.uid()) AS is_current_user
  FROM combined c
  ORDER BY c.score DESC, c.workouts_cnt DESC
  LIMIT 50;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_monthly_ranking(date) TO authenticated;

-- 3. Trigger to notify on new journal article via pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_journal_article()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
BEGIN
  -- Build the edge function URL using the project ref
  fn_url := 'https://wrxddctlyyiqgetiwdpu.supabase.co/functions/v1/journal-notify';

  PERFORM net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'article_id', NEW.id,
      'title', NEW.title,
      'excerpt', COALESCE(NEW.excerpt, NEW.summary),
      'category', NEW.category
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block insert if notify fails
  RAISE NOTICE 'journal notify failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_journal_article ON public.journal_articles;
CREATE TRIGGER trg_notify_new_journal_article
  AFTER INSERT ON public.journal_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_journal_article();