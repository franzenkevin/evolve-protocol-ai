CREATE TABLE public.food_diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  food_id uuid REFERENCES public.foods(id) ON DELETE SET NULL,
  name text NOT NULL,
  grams numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric NOT NULL DEFAULT 0,
  calories numeric NOT NULL DEFAULT 0,
  meal_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_diary_entries TO authenticated;
GRANT ALL ON public.food_diary_entries TO service_role;

ALTER TABLE public.food_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own diary entries" ON public.food_diary_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diary entries (today only)" ON public.food_diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id AND entry_date = CURRENT_DATE);
CREATE POLICY "Users update own diary entries (today only)" ON public.food_diary_entries
  FOR UPDATE USING (auth.uid() = user_id AND entry_date = CURRENT_DATE);
CREATE POLICY "Users delete own diary entries (today only)" ON public.food_diary_entries
  FOR DELETE USING (auth.uid() = user_id AND entry_date = CURRENT_DATE);
CREATE POLICY "Admins view all diary entries" ON public.food_diary_entries
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_food_diary_user_date ON public.food_diary_entries(user_id, entry_date DESC);

CREATE TRIGGER update_food_diary_entries_updated_at
  BEFORE UPDATE ON public.food_diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();