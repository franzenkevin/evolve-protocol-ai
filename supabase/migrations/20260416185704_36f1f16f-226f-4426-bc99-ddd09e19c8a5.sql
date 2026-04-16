
CREATE TABLE public.diet_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  adherence INTEGER NOT NULL DEFAULT 100 CHECK (adherence >= 0 AND adherence <= 100),
  hunger_level INTEGER CHECK (hunger_level >= 1 AND hunger_level <= 5),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  digestion INTEGER CHECK (digestion >= 1 AND digestion <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, rated_date)
);

ALTER TABLE public.diet_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diet feedback"
  ON public.diet_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diet feedback"
  ON public.diet_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet feedback"
  ON public.diet_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_diet_feedback_updated_at
  BEFORE UPDATE ON public.diet_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_diet_feedback_user_date ON public.diet_feedback (user_id, rated_date DESC);
