-- 1. Expandir tabela exercises com campos de complexidade
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS movement_pattern text,
  ADD COLUMN IF NOT EXISTS primary_muscles text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS secondary_muscles text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS load_type text,
  ADD COLUMN IF NOT EXISTS tempo text;

-- 2. Criar tabela mobility_exercises
CREATE TABLE IF NOT EXISTS public.mobility_exercises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL,
  type text NOT NULL DEFAULT 'dinamico',
  duration_seconds integer DEFAULT 30,
  reps integer,
  side text DEFAULT 'bilateral',
  equipment text,
  video_url text,
  instructions text,
  difficulty text DEFAULT 'iniciante',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mobility_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mobility exercises"
  ON public.mobility_exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert mobility exercises"
  ON public.mobility_exercises FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update mobility exercises"
  ON public.mobility_exercises FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete mobility exercises"
  ON public.mobility_exercises FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_mobility_exercises_updated_at
  BEFORE UPDATE ON public.mobility_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_mobility_exercises_region ON public.mobility_exercises(region);
CREATE INDEX IF NOT EXISTS idx_exercises_movement_pattern ON public.exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises(difficulty);