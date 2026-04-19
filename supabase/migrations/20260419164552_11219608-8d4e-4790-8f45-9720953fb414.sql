CREATE TABLE public.onboarding_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own draft"
  ON public.onboarding_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own draft"
  ON public.onboarding_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft"
  ON public.onboarding_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft"
  ON public.onboarding_drafts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_onboarding_drafts_updated_at
  BEFORE UPDATE ON public.onboarding_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();