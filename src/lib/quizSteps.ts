// Quiz Evoria — config dos 33 passos + telas extras
// Inspirado no funil MyFitCoach, com copy e identidade Evoria

export type QuizOption = {
  value: string;
  label: string;
  emoji?: string;
  description?: string;
};

export type QuizStep =
  | {
      id: string;
      type: "choice";
      title: string;
      subtitle?: string;
      options: QuizOption[];
      multi?: boolean;
    }
  | {
      id: string;
      type: "slider";
      title: string;
      subtitle?: string;
      min: number;
      max: number;
      step?: number;
      unit?: string;
      defaultValue?: number;
    }
  | {
      id: string;
      type: "number";
      title: string;
      subtitle?: string;
      unit?: string;
      placeholder?: string;
      min?: number;
      max?: number;
      derived?: "bmi";
    }
  | {
      id: string;
      type: "date";
      title: string;
      subtitle?: string;
    }
  | {
      id: string;
      type: "info";
      title: string;
      subtitle?: string;
      body?: string;
      variant?: "chart" | "social-proof" | "transition";
    }
  | {
      id: string;
      type: "body-shape";
      title: string;
      subtitle?: string;
      field: "current_shape" | "target_shape";
    }
  | {
      id: string;
      type: "bodyfat-slider";
      title: string;
      subtitle?: string;
    };

export const quizSteps: QuizStep[] = [
  // 1
  {
    id: "gender",
    type: "choice",
    title: "Vamos começar — qual seu gênero?",
    subtitle: "Isso ajuda a calibrar treino, dieta e referências corporais.",
    options: [
      { value: "male", label: "Masculino", emoji: "♂️" },
      { value: "female", label: "Feminino", emoji: "♀️" },
      { value: "other", label: "Prefiro não dizer", emoji: "⚪" },
    ],
  },
  // 2
  {
    id: "age_range",
    type: "choice",
    title: "Qual sua faixa de idade?",
    options: [
      { value: "18-29", label: "18 — 29 anos" },
      { value: "30-39", label: "30 — 39 anos" },
      { value: "40-49", label: "40 — 49 anos" },
      { value: "50+", label: "50+" },
    ],
  },
  // 3
  {
    id: "social_proof_1",
    type: "info",
    title: "Você não está sozinho.",
    subtitle: "Mais de 12.000 pessoas já estruturaram a rotina com a Evoria.",
    body: "97% dos usuários sentiram diferença nas primeiras 4 semanas seguindo o protocolo gerado.",
    variant: "social-proof",
  },
  // 4
  {
    id: "main_goal",
    type: "choice",
    title: "Qual seu principal objetivo agora?",
    subtitle: "Sua estrutura inteira é construída em volta dessa resposta.",
    options: [
      { value: "lose_fat", label: "Perder gordura", emoji: "🔥" },
      { value: "gain_muscle", label: "Ganhar massa muscular", emoji: "💪" },
      { value: "recomp", label: "Recomposição (perder gordura e ganhar músculo)", emoji: "⚡" },
      { value: "performance", label: "Performance e saúde", emoji: "🚀" },
    ],
  },
  // 5
  {
    id: "current_shape",
    type: "body-shape",
    title: "Qual sua forma corporal atual?",
    subtitle: "Escolha o que mais se parece — não precisa ser exato.",
    field: "current_shape",
  },
  // 6
  {
    id: "target_shape",
    type: "body-shape",
    title: "Onde você quer chegar?",
    subtitle: "É a referência que vamos usar para projetar sua jornada.",
    field: "target_shape",
  },
  // 7
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
  // 8
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
  // 9
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
  // 10
  {
    id: "desired_frequency",
    type: "choice",
    title: "Quantos dias por semana quer treinar?",
    subtitle: "Seja realista — consistência vale mais que volume.",
    options: [
      { value: "3", label: "3 dias" },
      { value: "4", label: "4 dias" },
      { value: "5", label: "5 dias" },
      { value: "6", label: "6 dias" },
    ],
  },
  // 11
  {
    id: "session_duration",
    type: "choice",
    title: "Quanto tempo por sessão é viável?",
    options: [
      { value: "30", label: "30 minutos" },
      { value: "45", label: "45 minutos" },
      { value: "60", label: "60 minutos" },
      { value: "75+", label: "75 minutos ou mais" },
    ],
  },
  // 12
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
  // 13
  {
    id: "location",
    type: "choice",
    title: "Onde você vai treinar?",
    options: [
      { value: "gym_big", label: "Academia completa", emoji: "🏋️" },
      { value: "gym_small", label: "Academia pequena", emoji: "🏠" },
      { value: "home_equip", label: "Em casa, com equipamento", emoji: "🧰" },
      { value: "home_body", label: "Em casa, peso corporal", emoji: "🤸" },
    ],
  },
  // 14
  {
    id: "gym_type",
    type: "choice",
    title: "Que tipo de equipamento você tem acesso?",
    options: [
      { value: "full", label: "Tudo — máquinas, livres, cabos" },
      { value: "free", label: "Pesos livres e barras" },
      { value: "minimal", label: "Halteres e elásticos" },
      { value: "none", label: "Sem equipamento" },
    ],
  },
  // 15
  {
    id: "split_pref",
    type: "choice",
    title: "Você tem preferência por algum tipo de divisão de treino?",
    subtitle: "Se não, deixaremos o sistema escolher o ideal para você.",
    options: [
      { value: "ppl", label: "Push / Pull / Legs" },
      { value: "ab", label: "AB (superior/inferior)" },
      { value: "abcd", label: "ABCD" },
      { value: "system", label: "Deixar o sistema decidir", emoji: "✨" },
    ],
  },
  // 16
  {
    id: "progress_chart",
    type: "info",
    title: "Veja a curva de progresso projetada.",
    subtitle: "É o ritmo médio de quem segue o protocolo nas primeiras 4 semanas.",
    body: "Este gráfico é apenas para fins ilustrativos.",
    variant: "chart",
  },
  // 17
  {
    id: "priority_muscles",
    type: "choice",
    title: "Há músculos que você quer priorizar?",
    multi: true,
    subtitle: "Você pode escolher mais de um.",
    options: [
      { value: "chest", label: "Peito", emoji: "💪" },
      { value: "back", label: "Costas", emoji: "🦾" },
      { value: "shoulders", label: "Ombros" },
      { value: "arms", label: "Braços" },
      { value: "glutes", label: "Glúteos" },
      { value: "legs", label: "Pernas" },
      { value: "core", label: "Abdômen" },
      { value: "none", label: "Nenhum — corpo todo" },
    ],
  },
  // 18
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
  // 19
  {
    id: "motivation",
    type: "choice",
    title: "O que mais te motiva nessa jornada?",
    options: [
      { value: "health", label: "Saúde e longevidade" },
      { value: "aesthetic", label: "Estética e autoestima" },
      { value: "performance", label: "Performance esportiva" },
      { value: "discipline", label: "Construir disciplina" },
    ],
  },
  // 20
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
  // 21
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
  // 22
  {
    id: "energy",
    type: "slider",
    title: "Como está seu nível de energia hoje?",
    subtitle: "0 = exausto · 10 = no auge",
    min: 0,
    max: 10,
    defaultValue: 5,
  },
  // 23
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
  // 24
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
  // 25
  {
    id: "quit_insight",
    type: "info",
    title: "O motivo número 1 da desistência? Falta de estrutura.",
    subtitle: "Não força de vontade.",
    body: "É exatamente esse o problema que a Evoria resolve. Sua rotina vira sistema — você só executa.",
    variant: "transition",
  },
  // 26
  {
    id: "bodyfat",
    type: "bodyfat-slider",
    title: "Estime seu percentual de gordura",
    subtitle: "Não precisa ser exato — a referência visual ajuda.",
  },
  // 27
  {
    id: "height",
    type: "number",
    title: "Qual sua altura?",
    unit: "cm",
    placeholder: "175",
    min: 130,
    max: 230,
  },
  // 28
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
  // 29
  {
    id: "target_weight",
    type: "number",
    title: "Qual seu peso alvo?",
    subtitle: "Onde você quer chegar nos próximos meses.",
    unit: "kg",
    placeholder: "70",
    min: 35,
    max: 250,
  },
  // 30
  {
    id: "age",
    type: "number",
    title: "Qual sua idade exata?",
    unit: "anos",
    placeholder: "28",
    min: 14,
    max: 90,
  },
  // 31
  {
    id: "fitness_profile",
    type: "choice",
    title: "Como descreveria seu perfil hoje?",
    options: [
      { value: "novice", label: "Estou começando do zero" },
      { value: "returning", label: "Estou voltando após uma pausa" },
      { value: "stuck", label: "Treino, mas estagnei" },
      { value: "evolving", label: "Quero levar a outro nível" },
    ],
  },
  // 32
  {
    id: "target_event",
    type: "choice",
    title: "Tem algum evento alvo?",
    subtitle: "Casamento, viagem, competição, prazo pessoal — qualquer coisa.",
    options: [
      { value: "yes", label: "Sim, tenho uma data" },
      { value: "no", label: "Não, é um objetivo contínuo" },
    ],
  },
  // 33
  {
    id: "confidence",
    type: "slider",
    title: "Quão confiante você está em começar agora?",
    subtitle: "0 = indeciso · 10 = totalmente decidido",
    min: 0,
    max: 10,
    defaultValue: 7,
  },
];

export const TOTAL_QUIZ_STEPS = quizSteps.length;
