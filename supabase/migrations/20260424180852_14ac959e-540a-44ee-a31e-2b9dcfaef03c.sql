
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wake_time text,
  ADD COLUMN IF NOT EXISTS sleep_time text,
  ADD COLUMN IF NOT EXISTS intermittent_fasting boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fasting_window text,
  ADD COLUMN IF NOT EXISTS meal_schedule text;
