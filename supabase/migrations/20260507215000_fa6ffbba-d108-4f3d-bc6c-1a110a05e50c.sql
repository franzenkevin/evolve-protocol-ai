
-- 1) Tabela de desafios mensais
CREATE TABLE public.monthly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_points INTEGER NOT NULL DEFAULT 0,
  month_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage challenges"
ON public.monthly_challenges FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated view active challenges"
ON public.monthly_challenges FOR SELECT
TO authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_monthly_challenges_updated_at
BEFORE UPDATE ON public.monthly_challenges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Atualiza função de ranking
CREATE OR REPLACE FUNCTION public.get_monthly_ranking(
  _month_start date DEFAULT (date_trunc('month', CURRENT_DATE::timestamptz))::date
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
SET search_path TO 'public'
AS $$
  WITH mw AS (
    SELECT _month_start AS start_d, (_month_start + interval '1 month')::date AS end_d
  ),
  workout_days AS (
    SELECT w.user_id, COUNT(DISTINCT w.session_date)::int AS cnt,
           array_agg(DISTINCT w.session_date) AS days
    FROM public.workout_logs w, mw
    WHERE w.session_date >= mw.start_d AND w.session_date < mw.end_d
    GROUP BY w.user_id
  ),
  diet_days AS (
    SELECT d.user_id, COUNT(DISTINCT d.rated_date)::int AS cnt,
           array_agg(DISTINCT d.rated_date) AS days
    FROM public.diet_feedback d, mw
    WHERE d.rated_date >= mw.start_d AND d.rated_date < mw.end_d
    GROUP BY d.user_id
  ),
  -- Streaks de 7 dias seguidos com treino E dieta no mesmo dia
  combined_days AS (
    SELECT w.user_id, w.session_date AS day
    FROM public.workout_logs w, mw
    WHERE w.session_date >= mw.start_d AND w.session_date < mw.end_d
      AND EXISTS (
        SELECT 1 FROM public.diet_feedback d
        WHERE d.user_id = w.user_id AND d.rated_date = w.session_date
      )
    GROUP BY w.user_id, w.session_date
  ),
  groups AS (
    SELECT user_id, day,
           day - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day))::int AS grp
    FROM combined_days
  ),
  streak_runs AS (
    SELECT user_id, COUNT(*) AS run_len
    FROM groups
    GROUP BY user_id, grp
  ),
  streak_bonus AS (
    SELECT user_id, (SUM(run_len / 7) * 10)::int AS bonus
    FROM streak_runs
    GROUP BY user_id
  ),
  checkin_stats AS (
    SELECT c.user_id, COUNT(*)::int AS cnt
    FROM public.checkins c, mw
    WHERE c.created_at >= mw.start_d AND c.created_at < mw.end_d
    GROUP BY c.user_id
  ),
  milestone_pts AS (
    SELECT m.user_id,
      COALESCE(SUM(CASE
        WHEN m.milestone_day BETWEEN 28 AND 32 THEN 10
        WHEN m.milestone_day >= 60 THEN 10
        ELSE 0
      END), 0)::int AS pts
    FROM public.protocol_milestone_feedbacks m, mw
    WHERE m.created_at >= mw.start_d AND m.created_at < mw.end_d
    GROUP BY m.user_id
  ),
  combined AS (
    SELECT
      p.user_id,
      COALESCE(NULLIF(split_part(p.full_name, ' ', 1), ''), 'Atleta') AS first_name,
      p.full_name,
      p.avatar_url,
      COALESCE(cs.cnt, 0) AS checkins_cnt,
      COALESCE(wd.cnt, 0) AS workouts_cnt,
      (
        COALESCE(wd.cnt, 0)                      -- 1pt/treino
        + COALESCE(dd.cnt, 0)                    -- 1pt/dia dieta
        + COALESCE(sb.bonus, 0)                  -- 10pts/streak 7d
        + (COALESCE(cs.cnt, 0) * 3)              -- 3pts/check semanal
        + COALESCE(mp.pts, 0)                    -- 10pts mensal/60d
      )::int AS score
    FROM public.profiles p
    LEFT JOIN workout_days wd ON wd.user_id = p.user_id
    LEFT JOIN diet_days dd ON dd.user_id = p.user_id
    LEFT JOIN streak_bonus sb ON sb.user_id = p.user_id
    LEFT JOIN checkin_stats cs ON cs.user_id = p.user_id
    LEFT JOIN milestone_pts mp ON mp.user_id = p.user_id
    WHERE COALESCE(wd.cnt,0) + COALESCE(dd.cnt,0) + COALESCE(cs.cnt,0) + COALESCE(mp.pts,0) > 0
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY c.score DESC, c.workouts_cnt DESC)::int AS rank,
    c.user_id,
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
  LIMIT 100;
$$;
