-- Remove policy que permite LIST (CDN serve URLs públicas sem precisar de SELECT policy)
DROP POLICY IF EXISTS "Authenticated can view exercise videos" ON storage.objects;