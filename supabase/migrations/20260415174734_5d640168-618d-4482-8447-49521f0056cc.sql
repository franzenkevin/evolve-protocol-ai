ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS training_time text,
  ADD COLUMN IF NOT EXISTS sweet_preference text,
  ADD COLUMN IF NOT EXISTS supplements text[],
  ADD COLUMN IF NOT EXISTS free_meals text,
  ADD COLUMN IF NOT EXISTS meal_count integer;