-- Storage: admin can view all photos for coaching review
DROP POLICY IF EXISTS "Admins can view all photos" ON storage.objects;
CREATE POLICY "Admins can view all photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'photos'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admin SELECT policies for tables that were missing them
DROP POLICY IF EXISTS "Admins can view all diet feedback" ON public.diet_feedback;
CREATE POLICY "Admins can view all diet feedback"
ON public.diet_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all workout feedback" ON public.workout_feedback;
CREATE POLICY "Admins can view all workout feedback"
ON public.workout_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all daily ratings" ON public.daily_ratings;
CREATE POLICY "Admins can view all daily ratings"
ON public.daily_ratings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
CREATE POLICY "Admins can view all referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));