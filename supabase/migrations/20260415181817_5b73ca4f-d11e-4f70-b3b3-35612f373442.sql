CREATE TABLE public.body_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_paths TEXT[] NOT NULL DEFAULT '{}',
  body_fat_estimate TEXT,
  body_fat_category TEXT,
  posture_deviations TEXT[] DEFAULT '{}',
  strong_points TEXT[] DEFAULT '{}',
  weak_points TEXT[] DEFAULT '{}',
  muscle_development JSONB DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  overall_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments" ON public.body_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON public.body_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.body_assessments FOR UPDATE USING (auth.uid() = user_id);