-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;

-- Trigger that prevents users from changing sensitive columns (admins/service role bypass)
CREATE OR REPLACE FUNCTION public.protect_referral_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role and admins to change everything
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Regular users cannot modify these fields
  IF NEW.paid IS DISTINCT FROM OLD.paid
     OR NEW.cashback_amount IS DISTINCT FROM OLD.cashback_amount
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify protected referral fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_referral_fields ON public.referrals;
CREATE TRIGGER protect_referral_fields
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_referral_sensitive_fields();

-- Re-create user update policy WITH a check to keep ownership intact
CREATE POLICY "Users can update own referrals"
  ON public.referrals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to update any referral (e.g. approve payouts)
CREATE POLICY "Admins can update any referral"
  ON public.referrals FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));