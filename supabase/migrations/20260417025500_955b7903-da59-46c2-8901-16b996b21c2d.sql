DROP POLICY IF EXISTS "Public can view exercise videos" ON storage.objects;

CREATE POLICY "Authenticated can view exercise videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'exercise-videos');