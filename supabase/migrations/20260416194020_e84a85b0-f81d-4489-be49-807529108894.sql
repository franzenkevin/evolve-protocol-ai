CREATE TABLE IF NOT EXISTS public.workout_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE SET NULL,
  day_index integer NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  rating integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_index, session_date)
);

ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout feedback"
  ON public.workout_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout feedback"
  ON public.workout_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout feedback"
  ON public.workout_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_workout_feedback_updated_at
  BEFORE UPDATE ON public.workout_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();