-- Avatares: público para leitura direta (URLs públicas), listagem continua restrita pelas policies já criadas
UPDATE storage.buckets SET public = true WHERE id = 'avatars';