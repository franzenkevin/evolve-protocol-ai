
-- 1. Storage bucket for exercise videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-videos', 'exercise-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exercise-videos
CREATE POLICY "Anyone can view exercise videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-videos');

CREATE POLICY "Admins can upload exercise videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exercise videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'exercise-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exercise videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exercise-videos' AND public.has_role(auth.uid(), 'admin'));

-- 2. Admin policies on existing tables
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all checkins"
ON public.checkins FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all workout logs"
ON public.workout_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all protocols"
ON public.protocols FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Admin metrics RPC
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'onboarded_users', (SELECT COUNT(*) FROM public.profiles WHERE onboarding_complete = true),
    'new_users_30d', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    'active_users_7d', (
      SELECT COUNT(DISTINCT user_id) FROM (
        SELECT user_id FROM public.workout_logs WHERE session_date >= current_date - 7
        UNION
        SELECT user_id FROM public.checkins WHERE created_at >= now() - interval '7 days'
        UNION
        SELECT user_id FROM public.daily_ratings WHERE rated_date >= current_date - 7
      ) s
    ),
    'total_protocols', (SELECT COUNT(*) FROM public.protocols),
    'total_workouts', (SELECT COUNT(*) FROM public.workout_logs),
    'total_checkins', (SELECT COUNT(*) FROM public.checkins),
    'active_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
    'subscriptions_by_plan', (
      SELECT COALESCE(jsonb_object_agg(plan_type, c), '{}'::jsonb)
      FROM (SELECT plan_type, COUNT(*) c FROM public.subscriptions WHERE status = 'active' GROUP BY plan_type) t
    ),
    'renewals_next_30d', (
      SELECT COUNT(*) FROM public.subscriptions
      WHERE status = 'active' AND next_billing_date BETWEEN current_date AND current_date + 30
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 4. Seed admin account
DO $$
DECLARE
  admin_uid uuid;
  existing_uid uuid;
BEGIN
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'adminkevinfranzen@hypertrophy.app';

  IF existing_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token,
      email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_uid,
      'authenticated',
      'authenticated',
      'adminkevinfranzen@hypertrophy.app',
      crypt('Ana2208670612kevin!?', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Kevin Franzen (Admin)"}'::jsonb,
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', 'adminkevinfranzen@hypertrophy.app'),
      'email', admin_uid::text, now(), now(), now()
    );
  ELSE
    admin_uid := existing_uid;
  END IF;

  -- Mark profile onboarding_complete so admin doesn't get stuck on onboarding
  UPDATE public.profiles SET onboarding_complete = true WHERE user_id = admin_uid;

  -- Promote to admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_uid, 'admin')
  ON CONFLICT DO NOTHING;
  -- Remove default 'user' role to keep it clean
  DELETE FROM public.user_roles WHERE user_id = admin_uid AND role = 'user';
END $$;
