-- ============================================================
-- 1) Limpar mobility_exercises e inserir base PT-BR enxuta
-- ============================================================
DELETE FROM public.mobility_exercises;

INSERT INTO public.mobility_exercises (name, region, type, duration_seconds, reps, side, equipment, instructions, difficulty, video_url) VALUES
-- QUADRIL
('Rotação de quadril em pé', 'quadril', 'dinamico', 30, NULL, 'bilateral', NULL, 'Em pé, mãos na cintura. Faça círculos amplos com o quadril para um lado e depois para o outro.', 'iniciante', NULL),
('Elevação de joelho alternada', 'quadril', 'dinamico', NULL, 10, 'unilateral', NULL, 'Em pé, eleve um joelho até a altura do quadril e desça. Alterne os lados.', 'iniciante', NULL),
('Agachamento profundo segurado (deep squat hold)', 'quadril', 'estatico', 30, NULL, 'bilateral', NULL, 'Agache o mais fundo possível mantendo os calcanhares no chão e a coluna neutra. Segure a posição respirando fundo.', 'iniciante', NULL),
('Flexor de quadril (90/90)', 'quadril', 'estatico', 30, NULL, 'unilateral', NULL, 'Sentado no chão com uma perna à frente em 90° e outra atrás em 90°. Inclinar o tronco para frente sentindo o glúteo.', 'iniciante', NULL),

-- COLUNA TORÁCICA
('Gato-camelo', 'coluna_toracica', 'dinamico', NULL, 10, 'bilateral', NULL, 'De quatro apoios, alterne entre arquear a coluna para cima (gato) e afundá-la (camelo). Movimento suave e controlado.', 'iniciante', NULL),
('Rotação torácica de quatro apoios', 'coluna_toracica', 'dinamico', NULL, 8, 'unilateral', NULL, 'De quatro, leve uma mão atrás da cabeça e gire o cotovelo em direção ao teto, depois para baixo passando por baixo do braço de apoio.', 'iniciante', NULL),
('Abertura no rolo (foam roller)', 'coluna_toracica', 'estatico', 60, NULL, 'bilateral', 'foam roller', 'Deite-se com o rolo na altura das escápulas, mãos atrás da cabeça, deixe a coluna torácica estender-se sobre o rolo.', 'iniciante', NULL),

-- OMBROS
('Círculos de ombro', 'ombros', 'dinamico', 30, NULL, 'bilateral', NULL, 'Em pé, faça círculos amplos com os ombros para trás e depois para frente.', 'iniciante', NULL),
('Passada de bastão (shoulder dislocates)', 'ombros', 'dinamico', NULL, 10, 'bilateral', 'bastão ou elástico', 'Segure um bastão à frente com pegada larga. Passe-o por cima da cabeça até atrás das costas e volte, sem dobrar os cotovelos.', 'iniciante', NULL),
('Alongamento da posterior do ombro (cross-body)', 'ombros', 'estatico', 30, NULL, 'unilateral', NULL, 'Cruze um braço à frente do corpo e puxe-o suavemente com a outra mão pelo cotovelo.', 'iniciante', NULL),

-- TORNOZELO
('Mobilidade de tornozelo na parede', 'tornozelo', 'dinamico', NULL, 10, 'unilateral', NULL, 'De frente para a parede, joelho à frente, leve o joelho na direção da parede sem tirar o calcanhar do chão.', 'iniciante', NULL),
('Alongamento de panturrilha na parede', 'tornozelo', 'estatico', 30, NULL, 'unilateral', NULL, 'Com as mãos na parede, uma perna atrás esticada e calcanhar no chão. Empurre o quadril para frente.', 'iniciante', NULL),

-- JOELHO
('Aquecimento de joelho (mini-squat)', 'joelho', 'dinamico', NULL, 15, 'bilateral', NULL, 'Pés afastados na largura do quadril, faça meio agachamento controlado focando em alinhamento joelho-pé.', 'iniciante', NULL),
('Alongamento do quadríceps em pé', 'joelho', 'estatico', 30, NULL, 'unilateral', NULL, 'Em pé, segure o pé atrás trazendo o calcanhar em direção ao glúteo. Mantenha os joelhos alinhados.', 'iniciante', NULL),

-- CERVICAL
('Inclinação cervical lateral', 'cervical', 'estatico', 20, NULL, 'unilateral', NULL, 'Incline a cabeça lateralmente levando a orelha em direção ao ombro. Pode usar a mão para um leve auxílio.', 'iniciante', NULL),
('Rotação cervical', 'cervical', 'dinamico', NULL, 8, 'bilateral', NULL, 'Gire a cabeça lentamente para um lado e depois para o outro, sem forçar o final do movimento.', 'iniciante', NULL),

-- PUNHO
('Círculos de punho', 'punho', 'dinamico', 20, NULL, 'bilateral', NULL, 'Faça círculos com os punhos em ambas as direções com os braços estendidos à frente.', 'iniciante', NULL),
('Alongamento de flexores do punho', 'punho', 'estatico', 20, NULL, 'unilateral', NULL, 'Braço estendido à frente com a palma para cima, puxe os dedos para baixo com a outra mão.', 'iniciante', NULL),

-- GLOBAL (aquecimento geral)
('Polichinelo (jumping jacks)', 'global', 'dinamico', 45, NULL, 'bilateral', NULL, 'Saltos abrindo e fechando braços e pernas simultaneamente. Aquecimento cardiovascular geral.', 'iniciante', NULL),
('Caminhada estática elevando joelhos', 'global', 'dinamico', 45, NULL, 'bilateral', NULL, 'Marche no lugar elevando bem os joelhos. Boa opção em espaços pequenos.', 'iniciante', NULL),
('World''s greatest stretch', 'global', 'dinamico', NULL, 6, 'unilateral', NULL, 'Posição de afundo. Apoie a mão oposta ao pé da frente no chão. Gire o tronco abrindo o braço de cima para o teto. Alterne os lados.', 'intermediario', NULL);

-- ============================================================
-- 2) Mural público de feedback (depoimentos)
-- ============================================================
CREATE TABLE public.app_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL CHECK (char_length(text) BETWEEN 10 AND 1000),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
  ON public.app_testimonials FOR SELECT
  TO authenticated
  USING (approved = true OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own testimonial"
  ON public.app_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND approved = false);

CREATE POLICY "Users can update own pending testimonial"
  ON public.app_testimonials FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND approved = false)
  WITH CHECK (user_id = auth.uid() AND approved = false);

CREATE POLICY "Admins can update any testimonial"
  ON public.app_testimonials FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete testimonials"
  ON public.app_testimonials FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_testimonials_updated_at
  BEFORE UPDATE ON public.app_testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_app_testimonials_approved ON public.app_testimonials(approved, created_at DESC);

-- ============================================================
-- 3) SAC / Suporte: tabela de tickets internos
-- ============================================================
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 200),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own ticket"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status, created_at DESC);