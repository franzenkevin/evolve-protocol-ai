DROP POLICY IF EXISTS "Authenticated can view exercise videos" ON storage.objects;

CREATE POLICY "Public can read exercise videos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'exercise-videos');