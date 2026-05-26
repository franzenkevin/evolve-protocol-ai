// Quiz Evoria — funil completo (gênero é o passo 1; idade exata é perguntada no final)

export type QuizOption = {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
};

export type QuizStep =
  | { id: string; type: "gender"; title: string; subtitle?: string }
  | { id: string; type: "choice"; title: string; subtitle?: string; options: QuizOption[]; multi?: boolean }
  | { id: string; type: "slider"; title: string; subtitle?: string; min: number; max: number; step?: number; unit?: string; defaultValue?: number }
  | { id: string; type: "number"; title: string; subtitle?: string; unit?: string; placeholder?: string; min?: number; max?: number; derived?: "bmi" }
  | { id: string; type: "weight-target"; title: string; subtitle?: string; unit?: string; placeholder?: string; min?: number; max?: number }
  | { id: string; type: "event-target"; title: string; subtitle?: string }
  | { id: string; type: "info"; title: string; subtitle?: string; body?: string; variant?: "social-proof" | "transition" | "kevin-method" }
  | { id: string; type: "body-shape"; title: string; subtitle?: string; field: "current_shape" | "target_shape" }
  | { id: string; type: "bodyfat-slider"; title: string; subtitle?: string };

export const quizSteps: QuizStep[] = [
  // 1 — Gênero
  {
    id: "gender",
    type: "gender",
    title: "Vamos começar — você é:",
    subtitle: "Tudo é calibrado a partir daqui: treino, dieta e referências corporais.",
  },

  // 2 — Método Kevin
  {
    id: "kevin_method",
    type: "info",
    title: "Você não está sozinho nessa.",
    subtitle: "O método por trás da Evoria é o mesmo que o Kevin Franzen aplica há anos.",
    body:
      "Mais de 1.000 linhas de regras de programação traduzem todo o conhecimento e ciência aplicada do Kevin em um sistema que monta seu treino, sua dieta e ainda responde como um treinador real — pelo chat integrado, com respostas humanas, calibradas pela mesma metodologia. Você não recebe um PDF genérico. Você recebe a cabeça do Kevin organizada em sistema.",
    variant: "kevin-method",
  },

  // 3 — Objetivo
  {
    id: "main_goal",
    type: "choice",
    title: "Qual seu principal objetivo agora?",
    subtitle: "Sua estrutura inteira é construída em volta dessa resposta.",
    options: [
      { value: "lose_fat", label: "Perder gordura", emoji: "🔥" },
      { value: "gain_muscle", label: "Ganhar massa muscular", emoji: "💪" },
      { value: "performance", label: "Performance em outros esportes", emoji: "🚀" },
    ],
  },

  // 4 — Forma corporal atual
  {
    id: "current_shape",
    type: "body-shape",
    title: "Qual sua forma corporal atual?",
    subtitle: "Escolha o que mais se parece — não precisa ser exato.",
    field: "current_shape",
  },

  // 5 — Forma corporal alvo
  {
    id: "target_shape",
    type: "body-shape",
    title: "Onde você quer chegar?",
    subtitle: "É a referência que vamos usar para projetar sua jornada.",
    field: "target_shape",
  },

  // 6 — Frequência atual
  {
    id: "current_frequency",
    type: "choice",
    title: "Hoje, com que frequência você treina?",
    options: [
      { value: "none", label: "Não treino atualmente" },
      { value: "1-2", label: "1 a 2 vezes por semana" },
      { value: "3-4", label: "3 a 4 vezes por semana" },
      { value: "5+", label: "5 ou mais vezes por semana" },
    ],
  },

  // 7 — Histórico fitness
  {
    id: "fitness_history",
    type: "choice",
    title: "Como descreveria sua experiência com treino?",
    options: [
      { value: "beginner", label: "Iniciante", description: "Nunca treinei sério ou voltei depois de muito tempo" },
      { value: "intermediate", label: "Intermediário", description: "Treino consistente há alguns meses ou anos" },
      { value: "advanced", label: "Avançado", description: "Anos de treino sério com bom domínio técnico" },
    ],
  },

  // 8 — Padrão de peso
  {
    id: "weight_pattern",
    type: "choice",
    title: "Como o seu peso costuma se comportar?",
    options: [
      { value: "stable", label: "Geralmente estável", emoji: "📊" },
      { value: "yoyo", label: "Vai e volta (efeito sanfona)", emoji: "🔁" },
      { value: "gaining", label: "Vem ganhando peso", emoji: "📈" },
      { value: "losing", label: "Vem perdendo peso", emoji: "📉" },
    ],
  },

  // 9 — Dias por semana
  {
    id: "desired_frequency",
    type: "choice",
    title: "Quantos dias por semana quer treinar?",
    subtitle: "Seja realista — consistência vale mais que volume.",
    options: [
      { value: "2", label: "2 dias" },
      { value: "3", label: "3 dias" },
      { value: "4", label: "4 dias" },
      { value: "5", label: "5 dias" },
      { value: "6", label: "6 dias" },
    ],
  },

  // 10 — Tempo por sessão
  {
    id: "session_duration",
    type: "choice",
    title: "Quanto tempo por sessão é viável?",
    options: [
      { value: "45", label: "45 minutos" },
      { value: "60", label: "60 minutos" },
      { value: "90", label: "90 minutos" },
      { value: "120", label: "120 minutos" },
    ],
  },

  // 11 — Horário preferido
  {
    id: "preferred_time",
    type: "choice",
    title: "Em que horário você costuma treinar?",
    options: [
      { value: "morning", label: "Manhã", emoji: "🌅" },
      { value: "afternoon", label: "Tarde", emoji: "☀️" },
      { value: "evening", label: "Noite", emoji: "🌙" },
      { value: "varied", label: "Varia bastante", emoji: "🔄" },
    ],
  },

  // 12 — Onde
  {
    id: "location",
    type: "choice",
    title: "Onde você vai treinar?",
    options: [
      { value: "gym_full", label: "Academia completa", description: "Máquinas, pesos livres, cabos — kit completo", emoji: "🏋️" },
      { value: "gym_condo", label: "Academia de condomínio (básica)", description: "Equipamento limitado, sem muitas máquinas", emoji: "🏢" },
      { value: "home", label: "Treino em casa", description: "Com ou sem equipamento — vamos adaptar", emoji: "🏠" },
    ],
  },

  // 13 — Divisão preferida (opções por gênero, alinhadas ao método)
  {
    id: "split_pref",
    type: "choice",
    title: "Tem preferência por algum tipo de divisão?",
    subtitle: "Se não tiver, o sistema escolhe a melhor para o seu caso.",
    options: [],
  },

  // 14 — Lesões
  {
    id: "injuries",
    type: "choice",
    title: "Alguma lesão ou limitação que devemos considerar?",
    multi: true,
    options: [
      { value: "knee", label: "Joelho" },
      { value: "lower_back", label: "Lombar" },
      { value: "shoulder", label: "Ombro" },
      { value: "wrist", label: "Punho/cotovelo" },
      { value: "ankle", label: "Tornozelo" },
      { value: "none", label: "Nenhuma" },
    ],
  },

  // 15 — Tentativas anteriores
  {
    id: "previous_attempts",
    type: "choice",
    title: "Já tentou outras dietas ou programas antes?",
    options: [
      { value: "many", label: "Sim, vários — sem sucesso duradouro" },
      { value: "some", label: "Alguns, com resultados parciais" },
      { value: "few", label: "Poucos, sem consistência" },
      { value: "first", label: "Esta é minha primeira tentativa séria" },
    ],
  },

  // 16 — Dia típico
  {
    id: "typical_day",
    type: "choice",
    title: "Como é um dia típico para você?",
    options: [
      { value: "sedentary", label: "Sentado a maior parte do tempo" },
      { value: "light", label: "Movimento leve durante o dia" },
      { value: "active", label: "Ativo, fico em pé bastante" },
      { value: "very_active", label: "Trabalho físico intenso" },
    ],
  },

  // 17 — Sono
  {
    id: "sleep",
    type: "choice",
    title: "Como está seu sono?",
    options: [
      { value: "great", label: "Ótimo — 7h+ e acordo descansado" },
      { value: "ok", label: "Razoável — 6 a 7h" },
      { value: "bad", label: "Pouco — menos de 6h" },
      { value: "broken", label: "Fragmentado e ruim" },
    ],
  },

  // 18 — Água
  {
    id: "water",
    type: "choice",
    title: "Quanto de água você bebe por dia?",
    options: [
      { value: "low", label: "Menos de 1L" },
      { value: "mid", label: "Entre 1L e 2L" },
      { value: "good", label: "Entre 2L e 3L" },
      { value: "high", label: "Mais de 3L" },
    ],
  },

  // 19 — Insight transitório
  {
    id: "quit_insight",
    type: "info",
    title: "O motivo número 1 da desistência? Falta de estrutura.",
    subtitle: "Não força de vontade.",
    body:
      "É exatamente esse o problema que a Evoria resolve. Sua rotina vira sistema — você só executa.",
    variant: "transition",
  },

  // 20 — % gordura
  {
    id: "bodyfat",
    type: "bodyfat-slider",
    title: "Estime seu percentual de gordura",
    subtitle: "Não precisa ser exato — a referência visual ajuda.",
  },

  // 21 — Altura
  {
    id: "height",
    type: "number",
    title: "Qual sua altura?",
    unit: "cm",
    placeholder: "175",
    min: 130,
    max: 230,
  },

  // 22 — Peso
  {
    id: "weight",
    type: "number",
    title: "Qual seu peso atual?",
    unit: "kg",
    placeholder: "75",
    min: 35,
    max: 250,
    derived: "bmi",
  },

  // 23 — Peso alvo
  {
    id: "target_weight",
    type: "weight-target",
    title: "Qual seu peso alvo?",
    subtitle: "Onde você quer chegar nos próximos meses.",
    unit: "kg",
    placeholder: "70",
    min: 35,
    max: 250,
  },

  // 24 — Idade
  {
    id: "age",
    type: "number",
    title: "Qual sua idade?",
    unit: "anos",
    placeholder: "28",
    min: 14,
    max: 90,
  },

];

export const TOTAL_QUIZ_STEPS = quizSteps.length;

// Splits oficiais do método (workoutRules) ===============================
export const SPLITS_BY_GENDER = {
  male: [
    { value: "ppl", label: "Push · Pull · Legs", description: "Empurrar, puxar, pernas — clássico para hipertrofia" },
    { value: "upper_lower", label: "Upper · Lower", description: "Superior e Inferior alternados" },
    { value: "fb", label: "Full Body", description: "Corpo todo a cada sessão — ótimo para 2-3 dias" },
    { value: "lpplu", label: "L · P · P · L · U (5x)", description: "Perna · Push · Pull · Perna · Upper — alto volume" },
    { value: "system", label: "Deixar o sistema decidir", emoji: "✨", description: "Recomendado — calibrado pelo método" },
  ],
  female: [
    { value: "fb_inf", label: "Full Body com ênfase inferior", description: "Ideal para 2-3 dias, com prioridade glúteo/posterior" },
    { value: "inf_sup_alt", label: "Inferior · Superior alternado", description: "Para 4-6 dias, foco em volume de inferior" },
    { value: "inf_sup_glute", label: "Inf (quad) · Sup · Inf (post+glúteo)", description: "3 dias com divisão de inferior por ênfase" },
    { value: "system", label: "Deixar o sistema decidir", emoji: "✨", description: "Recomendado — calibrado pelo método" },
  ],
} as const;
