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
// ESQUEMA DE SÉRIES POR NÍVEL DE EXPERIÊNCIA
// Iniciante + Intermediário = MESMO esquema base.
// Avançado = esquema separado com mais aquecimentos.
// ============================================================================

export type SetScheme = {
  warmups: { percent: number; reps: string; note: string }[];
  validSets: { reps: string; effort: string; note: string }[];
  description: string;
};

export const SET_SCHEME_BASE: SetScheme = {
  warmups: [{ percent: 50, reps: "12", note: "Sem chegar próximo da falha — ativação" }],
  validSets: [
    { reps: "10", effort: "próximo da falha (RIR 1-2)", note: "Válida 1 — buscar 10 reps boas" },
    { reps: "8", effort: "próximo da falha (RIR 1-2)", note: "Válida 2 — manter mesma carga, alvo 8 reps" },
    { reps: "falha total", effort: "FALHA TOTAL", note: "Válida 3 — REPETIR carga da válida 2, ir até a falha total" },
  ],
  description: "Iniciantes e intermediários começam com 1 aquecimento 50% + 1 série 10 reps + 1 série 8 reps + 1 série falha (mesma carga das válidas)",
};

export const SET_SCHEME_ADVANCED: SetScheme = {
  warmups: [
    { percent: 50, reps: "12", note: "Aquecimento 1 — ativação" },
    { percent: 75, reps: "5-8", note: "Aquecimento 2 — preparação neural" },
  ],
  validSets: [
    { reps: "6-12 (variar entre exercícios)", effort: "próximo da falha", note: "Válida 1" },
    { reps: "6-12", effort: "próximo da falha", note: "Válida 2 (opcional)" },
    { reps: "falha total", effort: "FALHA TOTAL", note: "Última válida sempre falha total" },
  ],
  description: "Avançados: 1 aquecimento 50% + 1 aquecimento 75% + 1 a 3 séries válidas (a última SEMPRE falha total)",
};

export function getSetScheme(experience: string | null | undefined): {
  scheme: SetScheme;
  level: "base" | "advanced";
} {
  const exp = (experience || "").toLowerCase();
  const isAdvanced = exp.includes("avançado") || exp.includes("avancado");
  return isAdvanced
    ? { scheme: SET_SCHEME_ADVANCED, level: "advanced" }
    : { scheme: SET_SCHEME_BASE, level: "base" };
}

// ============================================================================
// TÉCNICAS AVANÇADAS — para uso sutil em trocas de treino (a cada 60 dias)
// ============================================================================

export type AdvancedTechnique = "standard" | "backoffset" | "peak_contraction" | "cluster_set";

export const TECHNIQUES_DESCRIPTION: Record<AdvancedTechnique, string> = {
  standard: "Execução padrão — séries válidas conforme nível",
  backoffset:
    "BACKOFFSET: após a última série de falha, fazer mais 1 série até a falha com até 30s de descanso, reduzindo carga em 20-40%. NÃO conta como série válida — é EXTRA. Aluno não precisa anotar a carga.",
  peak_contraction:
    "PICO DE CONTRAÇÃO: micro-isometria de 1-2s no pico de contração de cada repetição. Usar em músculos com dificuldade de ativação. Aplicar em todas as séries normais.",
  cluster_set:
    "CLUSTER SET: 4 blocos de 4 reps com 10s de intervalo entre blocos, com carga que normalmente faria apenas 8 reps. Após aquecimento, máximo 2 séries assim. Aluno anota carga + reps comuns + abrir aba 'blocos' no log.",
};

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
