-- Tornar buckets privados (impede listagem pública e exige signed URL para acesso)
UPDATE storage.buckets SET public = false WHERE id IN ('avatars', 'exercise-videos');

-- Remover políticas SELECT antigas que permitiam listagem ampla
DROP POLICY IF EXISTS "Public can read exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all avatars" ON storage.objects;

-- AVATARS: cada usuário só pode ver/listar arquivos dentro da própria pasta (user_id/...)
CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- AVATARS: admins podem ver todos (para painel admin)
CREATE POLICY "Admins can view all avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- EXERCISE-VIDEOS: somente usuários autenticados podem ler/listar
CREATE POLICY "Authenticated can view exercise videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exercise-videos');