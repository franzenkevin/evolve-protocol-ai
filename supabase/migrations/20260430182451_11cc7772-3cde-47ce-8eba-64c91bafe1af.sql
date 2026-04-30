CREATE TABLE public.protocol_milestone_feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  protocol_id uuid,
  milestone_day integer NOT NULL,
  diet_notes text,
  training_notes text,
  requests_notes text,
  routine_changes_notes text,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, protocol_id, milestone_day)
);

ALTER TABLE public.protocol_milestone_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own milestone feedbacks"
  ON public.protocol_milestone_feedbacks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own milestone feedbacks"
  ON public.protocol_milestone_feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own milestone feedbacks"
  ON public.protocol_milestone_feedbacks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all milestone feedbacks"
  ON public.protocol_milestone_feedbacks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages milestone feedbacks"
  ON public.protocol_milestone_feedbacks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER set_updated_at_milestone_feedbacks
  BEFORE UPDATE ON public.protocol_milestone_feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();