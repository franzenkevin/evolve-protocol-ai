/**
 * METODOLOGIA OFICIAL HYPERTROPHY — Regras de prescrição de treino
 *
 * Fonte única da verdade para divisões, volumes, esquema de séries.
 * Usado tanto pelo prompt da IA quanto pelo fallback rule-based local.
 */

// ============================================================================
// VOLUMES SEMANAIS POR MÚSCULO (séries válidas / semana)
// Contagem: 1 série de exercício = 1 para músculo principal + 0.5 para acessório
// Aquecimentos NÃO contam.
// ============================================================================

export const WEEKLY_VOLUME_MEN: Record<string, [number, number]> = {
  peito: [9, 20],
  costas: [12, 24],
  deltoide_frontal: [9, 12],
  deltoide_lateral: [9, 16],
  deltoide_posterior: [9, 12],
  biceps: [9, 12],
  triceps: [9, 12],
  trapezio: [4, 8],
  antebraco: [0, 8], // opcional
  abdomen: [8, 12],
  quadriceps: [9, 24],
  posterior_coxa: [9, 20],
  gluteo: [6, 16],
  panturrilha: [4, 16],
};

export const WEEKLY_VOLUME_WOMEN: Record<string, [number, number]> = {
  peito: [2, 4],
  costas: [9, 20],
  deltoide_frontal: [2, 6],
  deltoide_lateral: [4, 12],
  deltoide_posterior: [2, 6],
  biceps: [4, 8],
  triceps: [4, 8],
  trapezio: [0, 4],
  antebraco: [0, 4],
  abdomen: [8, 12],
  quadriceps: [9, 24],
  posterior_coxa: [9, 20],
  gluteo: [9, 20],
  panturrilha: [4, 16],
};

// ============================================================================
// DIVISÕES OFICIAIS — MULHERES
// ============================================================================

export type SplitVariant = {
  name: string;
  days: { code: string; focus: string; notes?: string }[];
  schedulingRules: string[];
  defaultChoice?: boolean;
};

export const SPLITS_WOMEN: Record<number, SplitVariant[]> = {
  3: [
    {
      name: "FB-FB-FB (Full Body 3x)",
      days: [
        { code: "A", focus: "Full Body — mobilidade específica + 5 inferiores + 2-3 superiores" },
        { code: "B", focus: "Full Body — mobilidade específica + 5 inferiores + 2-3 superiores" },
        { code: "C", focus: "Full Body — mobilidade específica + 5 inferiores + 2-3 superiores" },
      ],
      schedulingRules: ["NÃO pode ser em dias seguidos — exigir 1 dia descanso entre treinos"],
      defaultChoice: true,
    },
    {
      name: "Inf-Sup-Inf (3x)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
      ],
      schedulingRules: ["Pode ser em dias consecutivos OU distintos"],
    },
  ],
  4: [
    {
      name: "Inf-Sup-Inf-Sup (4x — divisão mais comum)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Superior" },
      ],
      schedulingRules: ["Independe dos dias treinados"],
      defaultChoice: true,
    },
    {
      name: "Inf-Sup-Inf(post)-Sup+gluteo (4x)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior — ênfase POSTERIOR + multiarticulares que NÃO quebrem descanso de amanhã" },
        { code: "D", focus: "Superior + glúteo isolado" },
      ],
      schedulingRules: ["Cuidar para C não atrapalhar D"],
    },
  ],
  5: [
    {
      name: "Inf-Sup-Inf-OFF-Inf-Sup (5x com folga no meio)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Inferior (após 1 dia OFF)" },
        { code: "E", focus: "Superior" },
      ],
      schedulingRules: ["Inserir 1 dia OFF obrigatório entre C e D"],
      defaultChoice: true,
    },
    {
      name: "Inf-Sup-Inf-Sup-Inf (5x corrido)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Superior" },
        { code: "E", focus: "Inferior" },
      ],
      schedulingRules: ["Pode ser corrido"],
    },
  ],
  6: [
    {
      name: "5x + 1 complemento",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Superior" },
        { code: "E", focus: "Inferior" },
        { code: "F", focus: "Cardio + abdômen + complemento (treinar mais que 5x para hipertrofia é desnecessário)" },
      ],
      schedulingRules: ["Após 5 dias de treino real, F é só cardio/abs/complemento"],
      defaultChoice: true,
    },
  ],
  7: [
    {
      name: "5x + 2 complementos",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Superior" },
        { code: "E", focus: "Inferior" },
        { code: "F", focus: "Cardio + abdômen" },
        { code: "G", focus: "Cardio leve + mobilidade" },
      ],
      schedulingRules: ["F e G são complementos — não treinos hipertróficos"],
      defaultChoice: true,
    },
  ],
};

// ============================================================================
// DIVISÕES OFICIAIS — HOMENS
// ============================================================================

export const SPLITS_MEN: Record<number, SplitVariant[]> = {
  3: [
    {
      name: "FB-FB-FB (Full Body 3x)",
      days: [
        { code: "A", focus: "Full Body" },
        { code: "B", focus: "Full Body" },
        { code: "C", focus: "Full Body" },
      ],
      schedulingRules: ["DEVE ter descanso entre eles — não pode ser corrido"],
    },
    {
      name: "Push-Inferior-Pull (3x)",
      days: [
        { code: "A", focus: "Push (peito + ombros + tríceps)" },
        { code: "B", focus: "Inferior (pernas completo)" },
        { code: "C", focus: "Pull (costas + bíceps)" },
      ],
      schedulingRules: [],
      defaultChoice: true,
    },
  ],
  4: [
    {
      name: "Push-Pull-Legs-Upper (4x)",
      days: [
        { code: "A", focus: "Push (peito + ombros + tríceps)" },
        { code: "B", focus: "Pull (costas + bíceps)" },
        { code: "C", focus: "Legs (perna completa)" },
        { code: "D", focus: "Upper (peito + costas + ombros + braços)" },
      ],
      schedulingRules: [
        "Pode ser sequência ou ter descanso entre algum dos dois",
        "PERGUNTAR: 1 perna completa só ou 1 perna + estímulos extra de inferior nos Push/Pull?",
        "Se aluno escolher 'estímulos extra de inferior': adicionar 1-2 exercícios de inferior nos Push e Pull, e SEMPRE inserir 1 dia OFF entre eles e o Legs",
      ],
      defaultChoice: true,
    },
  ],
  5: [
    {
      name: "Legs-Push-Pull-Legs-Upper (5x)",
      days: [
        { code: "A", focus: "Legs" },
        { code: "B", focus: "Push" },
        { code: "C", focus: "Pull" },
        { code: "D", focus: "Legs" },
        { code: "E", focus: "Upper" },
      ],
      schedulingRules: [
        "Pode ser direto ou ter descanso entre C e D (preferível: descanso entre C e D)",
        "Outras variações parecidas são permitidas, mas NUNCA trabalhamos um único músculo por dia",
      ],
      defaultChoice: true,
    },
  ],
  6: [
    {
      name: "PPL x2 (6x)",
      days: [
        { code: "A", focus: "Push" },
        { code: "B", focus: "Pull" },
        { code: "C", focus: "Legs" },
        { code: "D", focus: "Push" },
        { code: "E", focus: "Pull" },
        { code: "F", focus: "Legs" },
      ],
      schedulingRules: ["Volume alto — só para avançados com boa recuperação"],
      defaultChoice: true,
    },
  ],
};

// ============================================================================
// ESQUEMA DE SÉRIES POR NÍVEL DE EXPERIÊNCIA (METODOLOGIA OFICIAL)
// ============================================================================

export type SetScheme = {
  repsLabel: string; // formato curto exibido no card: "10/8/falha", "2x até falha (8-12)" etc.
  warmups: { percent: number; reps: string; note: string }[];
  validSets: { reps: string; effort: string; note: string }[];
  description: string;
  progressionRule: string;
};

/**
 * INICIANTE — esquema fixo 10/8/falha
 * 1 aquecimento (50% × 15 reps, sem aproximar da falha)
 * Válida 1: carga máxima já usada → ALVO 10 reps (próximo da falha)
 * Válida 2: AUMENTA 10-20% da carga → ALVO 8 reps (próximo da falha)
 * Válida 3: MANTÉM a carga da V2 → FALHA TOTAL (a série mais importante)
 */
export const SET_SCHEME_BEGINNER: SetScheme = {
  repsLabel: "10/8/falha",
  warmups: [
    { percent: 50, reps: "15", note: "Aquecimento — 50% da carga máxima já usada, SEM chegar próximo da falha" },
  ],
  validSets: [
    { reps: "10", effort: "próximo da falha", note: "Válida 1 — sua carga máxima já usada, vai até 10 somente" },
    { reps: "8", effort: "próximo da falha", note: "Válida 2 — AUMENTA 10-20% da carga, alvo 8 reps" },
    { reps: "falha", effort: "FALHA TOTAL", note: "Válida 3 — MANTÉM a carga da V2, vai até falhar (não conseguir mais movimentar)" },
  ],
  description:
    "Iniciante: 1 aquecimento 50%×15 + 10/8/falha (V1=10 com carga máxima atual, V2=8 com +10-20%, V3=falha total mantendo a carga da V2)",
  progressionRule:
    "Se na série de FALHA passar de 12 reps → AUMENTAR todos os pesos. Se ficar abaixo de 8 reps → DIMINUIR o peso. Entre 8 e 12 → progredir pelo menos 1 rep por semana até chegar em 12, depois subir carga. (Progressão contínua)",
};

/**
 * INTERMEDIÁRIO / AVANÇADO — 2 aquecimentos + 2 a 3 séries válidas (a última sempre falha total)
 * 1 aquecimento 50% + 1 aquecimento 75% + 2-3 válidas próximas da falha
 *
 * Zona-alvo de repetições é VARIÁVEL — escolhida pela IA conforme exercício/objetivo:
 *   - Compostos pesados / força: 5-9 reps (ex.: 3x6-9)
 *   - Hipertrofia clássica: 6-10 ou 8-12 reps (ex.: 3x6-10, 3x8-12)
 *   - Resistência muscular / isolados leves: 10-15 ou 15-20 reps
 *
 * Pode aplicar UMA técnica avançada (backoffset, cluster set, pico de contração ou bi-set sutil)
 */
export const SET_SCHEME_ADVANCED: SetScheme = {
  repsLabel: "8-12/8-12/falha",
  warmups: [
    { percent: 50, reps: "12", note: "Aquecimento 1 — ativação (sem aproximar da falha)" },
    { percent: 75, reps: "5-8", note: "Aquecimento 2 — preparação neural" },
  ],
  validSets: [
    { reps: "8-12", effort: "próximo da falha", note: "Válida 1 — RIR 1-2 (zona-alvo definida pela IA: 5-9, 6-10, 8-12, 10-15 ou 15-20)" },
    { reps: "8-12", effort: "próximo da falha", note: "Válida 2 — RIR 1-2 (mesma zona-alvo)" },
    { reps: "falha", effort: "FALHA TOTAL", note: "Última válida — SEMPRE falha total" },
  ],
  description:
    "Intermediário/Avançado: 2 aquecimentos (50% + 75%) + 2 a 3 séries válidas (a ÚLTIMA é SEMPRE falha total). Zona-alvo de reps escolhida pela IA conforme exercício: 5-9 (força), 6-10 ou 8-12 (hipertrofia), 10-15 ou 15-20 (resistência/isolados). Pode aplicar 1 técnica avançada quando indicado.",
  progressionRule:
    "Olhe SEMPRE a série de FALHA: passou do TOPO da zona-alvo → AUMENTAR carga. Ficou abaixo do PISO → DIMINUIR carga. Dentro da zona → progredir 1 rep/semana até chegar no topo, depois subir carga.",
};

export function getSetScheme(experience: string | null | undefined): {
  scheme: SetScheme;
  level: "beginner" | "advanced";
} {
  const exp = (experience || "").toLowerCase();
  const isBeginner = exp.includes("iniciante");
  return isBeginner
    ? { scheme: SET_SCHEME_BEGINNER, level: "beginner" }
    : { scheme: SET_SCHEME_ADVANCED, level: "advanced" };
}

// ============================================================================
// TÉCNICAS AVANÇADAS — uso pontual e justificado pela IA
// ============================================================================

export type AdvancedTechnique =
  | "standard"
  | "backoffset"
  | "peak_contraction"
  | "cluster_set"
  | "bi_set";

export const TECHNIQUES_DESCRIPTION: Record<AdvancedTechnique, string> = {
  standard: "Execução padrão — séries válidas conforme o nível do aluno",
  backoffset:
    "BACK-OFF SET: após a última série de falha, REDUZIR 20% da carga e fazer mais 1 série até a falha (até 30s de descanso). Não conta como série válida — é EXTRA. Aluno não precisa anotar a carga.",
  peak_contraction:
    "PICO DE CONTRAÇÃO: isometria de 2s no pico de contração em CADA repetição de TODAS as séries válidas. Aplicar em músculos com dificuldade de ativação (ex.: glúteo, dorsal, posterior).",
  cluster_set:
    "CLUSTER SET (formato 8/8/8): com uma carga que normalmente faria apenas 12 reps, faz 8 → descansa 10-15s → +8 → descansa 10-15s → +8. Aquecimento ÚNICO de 50% antes (sem 75%). Máximo 2 séries assim por exercício. Aluno anota carga e abre aba 'blocos' no log.",
  bi_set:
    "BI-SET: 2 exercícios de músculos DIFERENTES executados em sequência sem descanso entre eles. Usar APENAS em alguns exercícios do treino (não em todos), ideal para alunos com pouco tempo. Não substitui o esquema de séries válidas — apenas reorganiza o descanso.",
};

// Sugestão de quando a IA pode aplicar cada técnica (uso parcimonioso)
export const TECHNIQUE_USAGE_GUIDE = `
QUANDO usar cada técnica (uso PARCIMONIOSO — não em todos os exercícios):
- INICIANTE: 100% standard. Nenhuma técnica avançada.
- INTERMEDIÁRIO: até 1-2 exercícios por treino com técnica (geralmente pico de contração ou back-off em isolados).
- AVANÇADO: até 30-40% dos exercícios podem ter técnica, variando entre back-off, cluster set, pico de contração ou bi-set.
- BI-SET: prescrever quando o aluno informa POUCO TEMPO disponível (ex.: <45 min/sessão).
- CLUSTER SET: prescrever 1x por treino em compostos pesados quando objetivo é força + hipertrofia.
- BACK-OFF: ótimo finalizador em isolados (bíceps, tríceps, lateral, panturrilha).
- PICO DE CONTRAÇÃO: para músculos com mind-muscle connection ruim.
`;

// ============================================================================
// REGRA DE CONTAGEM DE VOLUME
// ============================================================================

export const VOLUME_COUNT_RULE = `
REGRA DE CONTAGEM DE VOLUME (semanal por músculo):
- 1 série de exercício = 1.0 série para o músculo PRINCIPAL trabalhado
- 1 série de exercício = 0.5 série para o músculo ACESSÓRIO principal
- Aquecimentos NÃO contam (só séries válidas)
- Backoffset NÃO conta (é extra)
- Cluster set conta como 1 série válida (mesmo sendo 16 reps em blocos)

Exemplos de contagem:
- Supino reto (3 séries válidas) → 3.0 peito + 1.5 deltoide frontal + 1.5 tríceps
- Puxada frontal (3 séries) → 3.0 costas + 1.5 bíceps
- Agachamento livre (3 séries) → 3.0 quadríceps + 1.5 glúteo + 0.5 posterior
- Elevação pélvica (3 séries) → 3.0 glúteo + 1.5 posterior
- Elevação lateral (3 séries) → 3.0 deltoide lateral
- Rosca direta (3 séries) → 3.0 bíceps
`;

// ============================================================================
// TEMPLATE DE PROMPT PARA A IA — método em string para injetar no system prompt
// ============================================================================

export function getMethodologyPromptSection(sex: "M" | "F"): string {
  const isWoman = sex === "F";
  const splits = isWoman ? SPLITS_WOMEN : SPLITS_MEN;
  const volumes = isWoman ? WEEKLY_VOLUME_WOMEN : WEEKLY_VOLUME_MEN;

  let splitsTxt = "";
  for (const [days, variants] of Object.entries(splits)) {
    splitsTxt += `\n### ${days}x na semana:\n`;
    variants.forEach((v, i) => {
      splitsTxt += `${i + 1}. **${v.name}**${v.defaultChoice ? " ⭐ (padrão)" : ""}\n`;
      v.days.forEach((d) => {
        splitsTxt += `   - ${d.code}: ${d.focus}${d.notes ? ` (${d.notes})` : ""}\n`;
      });
      if (v.schedulingRules.length) {
        splitsTxt += `   Regras: ${v.schedulingRules.join(" | ")}\n`;
      }
    });
  }

  let volumeTxt = "\n### Volume semanal alvo (séries válidas/semana):\n";
  for (const [muscle, [min, max]] of Object.entries(volumes)) {
    const label = muscle.replace(/_/g, " ");
    volumeTxt += `- ${label}: entre ${min} e ${max} séries${max === 0 ? " (opcional)" : ""}\n`;
  }

  return `
## METODOLOGIA OFICIAL — DIVISÕES PARA ${isWoman ? "MULHERES" : "HOMENS"}
${splitsTxt}

${volumeTxt}

${VOLUME_COUNT_RULE}

### CARDIO INTEGRADO AO PROTOCOLO:
- O cardio DEVE aparecer NA MESMA TELA dos treinos (não em local separado)
- Para cada dia de treino: campo "cardio" com modalidade/duração/intensidade quando aplicável
- Para o protocolo geral: campo "cardioPlan" com plano semanal de cardio
- Se cardio_enabled=false, omitir cardio completamente

### NUNCA TRABALHAR APENAS UM MÚSCULO POR DIA:
Mesmo nas divisões 5x/6x, sempre combinar grupos. NUNCA ter um dia "só peito" ou "só bíceps".

### SE A DIVISÃO ESCOLHIDA TEM MÚLTIPLAS VARIANTES:
Escolher a marcada como ⭐ padrão. As outras variantes serão oferecidas na fase de confirmação pós-análise (Fase 2).
`;
}
