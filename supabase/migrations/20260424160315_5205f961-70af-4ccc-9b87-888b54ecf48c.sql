-- Desabilita trigger de proteção temporariamente (estamos rodando como service role na migração)
ALTER TABLE public.user_roles DISABLE TRIGGER USER;

-- 1. Promover Kevin Treinador a admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('865cbc7f-1548-4391-9b08-5e301a145133', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove role 'user' duplicado dele para ficar só admin
DELETE FROM public.user_roles
WHERE user_id = '865cbc7f-1548-4391-9b08-5e301a145133' AND role = 'user';

-- 2. Limpar dados das contas de teste
DELETE FROM public.workout_logs WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.workout_feedback WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.diet_feedback WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.daily_ratings WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.checkins WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.body_assessments WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.protocols WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.protocol_regenerations WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.onboarding_drafts WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.subscriptions WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.referrals WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.refund_requests WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.support_tickets WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.push_subscriptions WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.app_testimonials WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.user_roles WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');
DELETE FROM public.profiles WHERE user_id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');

-- 3. Deletar das auth.users
DELETE FROM auth.users WHERE id IN ('068c4894-a9f2-4a25-995e-6edbdc5d2974', 'f1ba61a3-4585-4c57-a226-5c6eaa93170b');

-- Reabilita triggers
ALTER TABLE public.user_roles ENABLE TRIGGER USER;