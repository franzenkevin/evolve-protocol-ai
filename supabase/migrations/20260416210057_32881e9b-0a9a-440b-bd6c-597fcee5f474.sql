-- 1. Restringir live_meetings a usuários autenticados
DROP POLICY IF EXISTS "Anyone can view meetings" ON public.live_meetings;

CREATE POLICY "Authenticated users can view meetings"
  ON public.live_meetings FOR SELECT
  TO authenticated
  USING (true);

-- 2. Trigger defensivo em user_roles
-- Garante que apenas admins podem inserir role='admin', mesmo se a policy for alterada
CREATE OR REPLACE FUNCTION public.prevent_self_admin_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permite trigger handle_new_user (quando role default 'user' é inserido pelo sistema)
  IF NEW.role = 'admin' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can create admin roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_admin_promotion_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_admin_promotion_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_admin_promotion();