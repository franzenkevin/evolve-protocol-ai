
-- Auto-create referral coupon for every new profile + backfill existing users
CREATE OR REPLACE FUNCTION public.create_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
BEGIN
  -- Generate a unique 8-char alphanumeric code (uppercase)
  LOOP
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referrals WHERE referral_code = new_code);
  END LOOP;

  INSERT INTO public.referrals (user_id, referral_code, status)
  VALUES (NEW.user_id, new_code, 'pending')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_create_referral_code ON public.profiles;
CREATE TRIGGER profiles_create_referral_code
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_user_referral_code();

-- Backfill: create a referral code for every existing profile that does not yet have one
INSERT INTO public.referrals (user_id, referral_code, status)
SELECT
  p.user_id,
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  'pending'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.referrals r WHERE r.user_id = p.user_id
)
ON CONFLICT (referral_code) DO NOTHING;
