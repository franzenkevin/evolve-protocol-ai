DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;

CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 5 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (name IS NULL OR char_length(name) <= 200)
    AND (phone IS NULL OR char_length(phone) <= 30)
    AND (goal IS NULL OR char_length(goal) <= 200)
    AND (notes IS NULL OR char_length(notes) <= 1000)
    AND status = 'new'
    AND converted_user_id IS NULL
  );