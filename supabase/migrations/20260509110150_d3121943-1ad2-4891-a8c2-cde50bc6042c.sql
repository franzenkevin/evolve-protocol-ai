
CREATE TABLE public.protocol_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  protocol_id uuid,
  protocol_version integer,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text,
  admin_notes text,
  admin_email_sent_at timestamptz,
  admin_email_subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_protocol_feedback_user ON public.protocol_feedback(user_id);
CREATE INDEX idx_protocol_feedback_protocol ON public.protocol_feedback(protocol_id);
CREATE UNIQUE INDEX idx_protocol_feedback_unique ON public.protocol_feedback(user_id, protocol_id) WHERE protocol_id IS NOT NULL;

ALTER TABLE public.protocol_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own protocol feedback"
ON public.protocol_feedback FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own protocol feedback"
ON public.protocol_feedback FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own protocol feedback"
ON public.protocol_feedback FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all protocol feedback"
ON public.protocol_feedback FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update protocol feedback"
ON public.protocol_feedback FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_protocol_feedback_updated
BEFORE UPDATE ON public.protocol_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
