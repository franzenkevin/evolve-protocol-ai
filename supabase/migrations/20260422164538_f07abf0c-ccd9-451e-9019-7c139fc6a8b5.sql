ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS extra_activities text,
  ADD COLUMN IF NOT EXISTS current_diet_description text,
  ADD COLUMN IF NOT EXISTS disliked_from_list text;