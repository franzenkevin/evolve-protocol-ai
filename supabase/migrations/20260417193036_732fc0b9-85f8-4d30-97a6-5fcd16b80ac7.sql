-- ============================================
-- 1. NOVA TABELA: leads (pré-cadastro, separada de profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT DEFAULT 'landing',
  goal TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | qualified | converted | lost
  converted_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Captura pública (landing page pode inserir sem auth)
CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins view all leads"
  ON public.leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update leads"
  ON public.leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete leads"
  ON public.leads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. ALIMENTOS: adicionar fibra + porção padrão
-- ============================================
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS fiber NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portion_grams NUMERIC NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'; -- 'taco' | 'manual'

CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);

-- ============================================
-- 3. EXERCÍCIOS: índices para busca
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exercises_name ON public.exercises(name);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category);

-- ============================================
-- 4. JOURNAL: rascunhos com aprovação
-- ============================================
ALTER TABLE public.journal_articles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published'
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_sources JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT;

-- Atualiza policy pública: só publicados aparecem para usuários
DROP POLICY IF EXISTS "Anyone can view articles" ON public.journal_articles;
CREATE POLICY "Anyone can view published articles"
  ON public.journal_articles FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));