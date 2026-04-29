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
  2: [
    {
      name: "FB-FB com ênfase inferior (2x)",
      days: [
        { code: "A", focus: "Full Body — ênfase em inferiores (glúteo + quadríceps + posterior) + 1-2 superiores" },
        { code: "B", focus: "Full Body — ênfase em inferiores (glúteo + posterior + quadríceps) + 1-2 superiores" },
      ],
      schedulingRules: ["NÃO pode em dias seguidos — exigir descanso entre eles"],
      defaultChoice: true,
    },
  ],
  3: [
    {
      name: "FB-FB-FB com ênfase inferior (3x)",
      days: [
        { code: "A", focus: "Full Body — ênfase inferior (glúteo + quad)" },
        { code: "B", focus: "Full Body — ênfase inferior (posterior + glúteo)" },
        { code: "C", focus: "Full Body — ênfase inferior (glúteo médio + quad)" },
      ],
      schedulingRules: ["NÃO pode ser em dias seguidos — exigir 1 dia descanso entre treinos"],
      defaultChoice: true,
    },
    {
      name: "Inf(quad)-Sup-Inf(post+glúteo) (3x)",
      days: [
        { code: "A", focus: "Inferior — ênfase QUADRÍCEPS" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior — ênfase POSTERIOR + GLÚTEO" },
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
      name: "Inf-Sup-Inf-Sup-Inf (5x — alternado)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Superior" },
        { code: "E", focus: "Inferior" },
      ],
      schedulingRules: ["Pode ser corrido ou intercalando 1 OFF"],
      defaultChoice: true,
    },
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
    },
  ],
  6: [
    {
      name: "Inf-Sup-Inf-Sup-Inf-Sup (6x — alternado)",
      days: [
        { code: "A", focus: "Inferior" },
        { code: "B", focus: "Superior" },
        { code: "C", focus: "Inferior" },
        { code: "D", focus: "Superior" },
        { code: "E", focus: "Inferior" },
        { code: "F", focus: "Superior" },
      ],
      schedulingRules: ["Volume alto — só se a recuperação acompanhar; manter ênfase em glúteo/posterior"],
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
  2: [
    {
      name: "FB-FB (Full Body 2x)",
      days: [
        { code: "A", focus: "Full Body — compostos pesados (1 quad, 1 push, 1 pull, 1 posterior, 1 core)" },
        { code: "B", focus: "Full Body — compostos pesados (1 quad, 1 push, 1 pull, 1 posterior, 1 core)" },
      ],
      schedulingRules: ["DEVE ter pelo menos 2 dias de descanso entre eles"],
      defaultChoice: true,
    },
  ],
  3: [
    {
      name: "Push-Pull-Legs (PPL 3x)",
      days: [
        { code: "A", focus: "Push (peito + ombros + tríceps)" },
        { code: "B", focus: "Pull (costas + bíceps)" },
        { code: "C", focus: "Legs (perna completa)" },
      ],
      schedulingRules: ["Pode ser direto ou alternado"],
      defaultChoice: true,
    },
    {
      name: "FB-FB-FB (Full Body 3x)",
      days: [
        { code: "A", focus: "Full Body" },
        { code: "B", focus: "Full Body" },
        { code: "C", focus: "Full Body" },
      ],
      schedulingRules: ["DEVE ter descanso entre eles — não pode ser corrido"],
    },
  ],
  4: [
    {
      name: "Upper-Lower (4x)",
      days: [
        { code: "A", focus: "Upper (peito + costas + ombros + braços)" },
        { code: "B", focus: "Lower (perna completa)" },
        { code: "C", focus: "Upper" },
        { code: "D", focus: "Lower" },
      ],
      schedulingRules: ["Padrão: 2 dias on + 1 off + 2 dias on"],
      defaultChoice: true,
    },
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
        "NUNCA trabalhamos um único músculo por dia",
      ],
      defaultChoice: true,
    },
    {
      name: "Push1-Pull1-Legs-Push2-Pull2 (5x)",
      days: [
        { code: "A", focus: "Push 1 (ênfase peito)" },
        { code: "B", focus: "Pull 1 (ênfase costas largura)" },
        { code: "C", focus: "Legs (perna completa)" },
        { code: "D", focus: "Push 2 (ênfase ombro/tríceps)" },
        { code: "E", focus: "Pull 2 (ênfase costas espessura + bíceps)" },
      ],
      schedulingRules: ["Boa para avançados que querem priorizar superiores"],
    },
  ],
  6: [
    {
      name: "Push1-Pull1-Legs1-Push2-Pull2-Legs2 (PPL x2 — 6x)",
      days: [
        { code: "A", focus: "Push 1 (ênfase peito)" },
        { code: "B", focus: "Pull 1 (ênfase largura)" },
        { code: "C", focus: "Legs 1 (ênfase quadríceps)" },
        { code: "D", focus: "Push 2 (ênfase ombro)" },
        { code: "E", focus: "Pull 2 (ênfase espessura)" },
        { code: "F", focus: "Legs 2 (ênfase posterior + glúteo)" },
      ],
      schedulingRules: ["Volume alto — só para avançados com ótima recuperação"],
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
 * ESQUEMA PADRÃO — usado para TODOS os níveis (iniciante, intermediário e avançado).
 * A diferença por nível fica no NÚMERO de séries válidas (2 ou 3) e na escolha
 * de técnicas avançadas, não no formato do esquema.
 *
 * Estrutura:
 *  - 2 aquecimentos (50% e 75%) — pode pular o de 50% se já estiver bem aquecido,
 *    mas o IDEAL é fazer os dois.
 *  - 1 a 3 séries válidas próximas da falha (RIR 1-2). A ÚLTIMA é SEMPRE falha total.
 *  - Zona-alvo de reps escolhida pela IA por exercício (5-9 / 6-10 / 8-12 / 10-15 / 15-20).
 */
export const SET_SCHEME_STANDARD: SetScheme = {
  repsLabel: "8-12",
  warmups: [
    { percent: 50, reps: "12", note: "Aquecimento 1 — ativação leve. Pode pular se já estiver bem aquecido, mas o ideal é fazer." },
    { percent: 75, reps: "5-8", note: "Aquecimento 2 — preparação neural (recomendado SEMPRE)" },
  ],
  validSets: [
    { reps: "8-12", effort: "RIR 1-2 (próximo da falha)", note: "Válida — RIR 1-2: pare quando faltariam 1 a 2 reps para falhar" },
    { reps: "8-12", effort: "RIR 1-2 (próximo da falha)", note: "Válida — RIR 1-2 (mesma zona-alvo)" },
    { reps: "falha", effort: "FALHA TOTAL", note: "Última válida — SEMPRE falha total (não consegue mais movimentar)" },
  ],
  description:
    "Padrão (todos os níveis): 2 aquecimentos (50% + 75%) + 1 a 3 séries válidas (a ÚLTIMA é SEMPRE falha total). O número de válidas depende do protocolo/exercício. Zona-alvo escolhida pela IA: 5-9 (força), 6-10 ou 8-12 (hipertrofia), 10-15 ou 15-20 (resistência/isolados).",
  progressionRule:
    "Olhe SEMPRE a série de FALHA: passou do TOPO da zona-alvo → AUMENTAR carga. Ficou abaixo do PISO → DIMINUIR carga. Dentro da zona → progredir 1 rep/semana até chegar no topo, depois subir carga.",
};

// Compat: imports antigos.
export const SET_SCHEME_BEGINNER = SET_SCHEME_STANDARD;
export const SET_SCHEME_ADVANCED = SET_SCHEME_STANDARD;

export function getSetScheme(experience: string | null | undefined): {
  scheme: SetScheme;
  level: "beginner" | "intermediate" | "advanced";
} {
  const exp = (experience || "").toLowerCase();
  const level: "beginner" | "intermediate" | "advanced" = exp.includes("iniciante")
    ? "beginner"
    : exp.includes("avançado") || exp.includes("avancado")
      ? "advanced"
      : "intermediate";

  // Iniciante = 2 válidas (última na falha). Intermediário/avançado = 3 válidas (última na falha).
  const validSets =
    level === "beginner"
      ? [
          { reps: "8-12", effort: "RIR 1-2 (próximo da falha)", note: "Válida 1 — RIR 1-2: pare quando faltariam 1 a 2 reps" },
          { reps: "falha", effort: "FALHA TOTAL", note: "Válida 2 — SEMPRE falha total" },
        ]
      : SET_SCHEME_STANDARD.validSets;

  const scheme: SetScheme = { ...SET_SCHEME_STANDARD, validSets };
  return { scheme, level };
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
Usar a marcada como ⭐ padrão, A MENOS QUE o aluno tenha selecionado outra variante na confirmação pós-análise (campo confirmations.split.chosenVariant).

### REGRAS UNIVERSAIS DE PRESCRIÇÃO

**ABDÔMEN (OBRIGATÓRIO ${isWoman ? "para mulheres" : "para homens"})**:
- Pelo menos **2x na semana**, distribuído nos treinos (NÃO em dia separado para hipertrofia ${isWoman ? "" : "— exceto se for o 6º/7º dia complementar"})
- USAR APENAS: **Reto abdominal** (crunch, abdominal infra/elevação de pernas, prancha frontal). **NUNCA prescrever oblíquo** (treinar oblíquo aumenta a circunferência da cintura — não desejado em estética).

${
  isWoman
    ? `**MULHER — REGRAS ESPECÍFICAS**:
- **Peito**: NO MÁXIMO **1 exercício de peito por semana** (não há necessidade de mais). Mulher não precisa hipertrofiar peito.
- **Ênfase nos superiores**: SEMPRE **ombro (lateral + posterior) + costas** > peito + braços.
- **Ênfase nos inferiores**: protocolo COMPLETO de inferior, mas com **PRIORIDADE em GLÚTEO MÉDIO** (abdução, clamshell, hip thrust com rotação externa) e nos pontos fracos identificados na avaliação corporal.
- Nos dias de FB: ênfase obrigatória em inferiores (5+ exercícios de perna vs 1-2 superiores).`
    : `**HOMEM — REGRAS ESPECÍFICAS (anti-overtraining)**:
- Homens **TENDEM A TREINAR DEMAIS**. Você DEVE prescrever o **NECESSÁRIO**, NÃO o exagerado.
- Manter volume DENTRO da faixa, **preferindo o meio-baixo da faixa** quando o aluno é iniciante/intermediário.
- Explicar isso textualmente em **dynamicNotes** do primeiro dia: ex. "O volume está calibrado para o estímulo necessário — mais não é melhor, é overtraining. Confie no protocolo."`
}

### TÉCNICAS AVANÇADAS — USO PONTUAL APENAS
- Técnicas avançadas (back-off, pico de contração, cluster set, bi-set) são para serem usadas **APENAS EM ALGUNS EXERCÍCIOS** (não em todos) e **APENAS para protocolos de alunos AVANÇADOS**.
- INICIANTE: 100% standard.
- INTERMEDIÁRIO: 1-2 exercícios por treino com técnica.
- AVANÇADO: até 30-40% dos exercícios podem ter técnica.

### TREINO EM CASA (gym_type = "casa" ou similar)
- Dividir entre **superior / inferior** (2-4x semana) OU **fullbody** (2-3x semana). NÃO usar PPL ou divisões de academia.
- Indicar exercícios **com peso do corpo** (flexão, agachamento, afundo, prancha, ponte, dips de cadeira) e **uso de elásticos** (mini-band para abdução, faixa elástica para puxadas e remadas).
- Citar nas instruções que o aluno deve usar elásticos de tensões variadas para progressão.

### PERIODIZAÇÃO ONDULATÓRIA (METODOLOGIA OFICIAL)
- Usamos **periodização ondulatória** dentro do protocolo de 60 dias. Não é linear.
- **Sequência típica de volume entre os ciclos**:
  - Ciclo 1 (primeiro protocolo): volume **MEDIANO** dentro da faixa do músculo (alvo no MEIO da faixa).
  - Ciclo 2 (60 dias depois): volume **SUBINDO** — aproximar do TOPO da faixa nos músculos que progrediram.
  - Ciclo 3: volume **BAIXANDO** — descer para o piso/meio da faixa (funciona como **deload de volume**).
  - Ciclo 4 em diante: oscilar conforme evolução, sempre considerando o protocolo anterior.
- **Zona de repetições oscila junto**: alternar zonas (5-9 / 6-10 / 8-12 / 10-15) entre ciclos para o mesmo exercício, a fim de variar estímulo neural e mecânico.
- **OBRIGATÓRIO usar o protocolo anterior como BASE** quando ele for fornecido (campo previousProtocol no contexto):
  - Ler que exercícios o aluno já fez, em que zona de reps, em que volume.
  - **Manter coerência**: trocar 30-50% dos exercícios (variação de estímulo), MAS conservar a base do que funcionou.
  - **Ajustar volume e zona de reps** conforme a posição do ciclo na ondulação (subir/baixar).
  - **Progredir cargas** com base no histórico (se passou do topo da zona em V_falha → subiu carga; se ficou abaixo do piso → manteve ou baixou).
  - Citar a estratégia no campo dynamicNotes do primeiro dia: "Este ciclo é [médio/alto/baixo] em volume porque o ciclo anterior foi [X]. Variamos exercícios para novos estímulos e mantivemos os que mais funcionaram para você."
`;
}
