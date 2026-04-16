-- ============================================
-- PACOTE A: Correções de Segurança Crítica
-- ============================================

-- 1. BLOQUEAR AUTO-ASSINATURA
-- Remove capacidade do usuário criar/editar a própria subscription.
-- Apenas admin (e service_role via webhook futuro) podem escrever.
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- 2. BLOQUEAR LISTAGEM EM BUCKETS PÚBLICOS
-- Remove SELECT amplo que permite enumerar arquivos.
-- Arquivos seguem acessíveis via URL pública direta (CDN não passa por RLS).
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view exercise videos" ON storage.objects;

-- 3. PERMITIR DELETE/UPDATE DE FOTOS PRÓPRIAS (LGPD)
CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_date
  ON public.workout_logs (session_date DESC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
  ON public.workout_logs (user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_created_at
  ON public.checkins (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_user_created
  ON public.checkins (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing
  ON public.subscriptions (next_billing_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_plan
  ON public.subscriptions (status, plan_type);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_ratings_user_date
  ON public.daily_ratings (user_id, rated_date DESC);