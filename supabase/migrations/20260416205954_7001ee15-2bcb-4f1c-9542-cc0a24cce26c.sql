-- 1. SELECT explícito para exercise-videos (autenticados)
CREATE POLICY "Authenticated can view exercise videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'exercise-videos');

-- 2. Admin pode deletar roles (rebaixar admins)
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Admin pode deletar protocols
CREATE POLICY "Admins can delete protocols"
  ON public.protocols FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));