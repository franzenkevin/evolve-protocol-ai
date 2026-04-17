-- 1. body_assessments: admin SELECT + DELETE policies
CREATE POLICY "Admins can view all body assessments"
  ON public.body_assessments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own assessments"
  ON public.body_assessments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any assessment"
  ON public.body_assessments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. exercise-videos bucket: public SELECT policy
CREATE POLICY "Public can view exercise videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'exercise-videos');

-- 3. user_roles: explicit admin-only UPDATE; users cannot update their own roles
CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND auth.uid() <> user_id)
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() <> user_id);