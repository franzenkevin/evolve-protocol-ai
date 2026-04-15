
CREATE TABLE public.daily_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  rated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, rated_date)
);

ALTER TABLE public.daily_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ratings" ON public.daily_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ratings" ON public.daily_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.daily_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_daily_ratings_updated_at BEFORE UPDATE ON public.daily_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
