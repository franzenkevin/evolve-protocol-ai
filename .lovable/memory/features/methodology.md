---
name: AI Protocol Generation Methodology
description: Official Hypertrophy methodology for AI/rule-based protocol generation — splits, volumes, set schemes, advanced techniques
type: feature
---
**Source of truth**: `src/lib/workoutRules.ts` (used by both AI prompt and local fallback `generateProtocol.ts`)

**Generation flow**:
- Primary: openai/gpt-5 via Lovable AI Gateway (generate-protocol edge function), system prompt embeds the official splits + volume targets via `getMethodologyPromptSection(sex)`
- Fallback: rule-based `src/lib/generateProtocol.ts` uses the same workoutRules.ts (default-marked split variant per sex+days)
- AbortSignal.timeout(180000) — up to 3 min hard cap; UI shows up to 4 min counter
- response_format: json_object

**Splits (Phase 1 implemented)**:
- Women 3x: FB-FB-FB (default, exige descanso) | Inf-Sup-Inf
- Women 4x: Inf-Sup-Inf-Sup (default) | Inf-Sup-Inf(post)-Sup+glúteo
- Women 5x: Inf-Sup-Inf-OFF-Inf-Sup (default) | Inf-Sup-Inf-Sup-Inf
- Women 6x/7x: 5x + cardio/abs/complemento (treinar >5x para hipertrofia é desnecessário)
- Men 3x: FB-FB-FB | Push-Inferior-Pull (default)
- Men 4x: Push-Pull-Legs-Upper (default) — perguntar 1 perna só ou +estímulos inferior nos Push/Pull
- Men 5x: Legs-Push-Pull-Legs-Upper (default) — preferível OFF entre C e D
- Men 6x: PPL x2

**Volume counting rule**: 1 série = 1.0 para músculo principal + 0.5 para acessório. Aquecimentos NÃO contam. Backoffset NÃO conta. Cluster set conta como 1 série válida.

**Weekly volume targets** (séries válidas/semana) — definidos em `WEEKLY_VOLUME_MEN` e `WEEKLY_VOLUME_WOMEN`. AI deve respeitar min/max por músculo.

**Set schemes by experience**:
- Iniciante + intermediário (`SET_SCHEME_BASE`): 1 aquec 50% + 3 válidas (10 / 8 / falha mesma carga)
- Avançado (`SET_SCHEME_ADVANCED`): 2 aquec (50% + 75%) + 1-3 válidas (última SEMPRE falha total)
- Função de roteamento: `getSetScheme(profile.experience)`

**Cardio integrado**: aparece NA MESMA TELA dos treinos (campo `cardio` por dia + `cardioPlan` global). NUNCA em local separado. Se `cardio_enabled=false`, omitir.

**Advanced techniques** (`AdvancedTechnique`): standard | backoffset | peak_contraction | cluster_set
- Phase 2: IA prescreve sutilmente em trocas de treino (a cada 60d), baseado em músculo fraco
- Cluster set requer aba "blocos" no log de treino

**Mandatory checklist in prompt**: read assessment → read injuries → prioritize weak points → correct posture deviations → choose split per sex+days → validate each exercise → verify weekly volume per muscle.

**INJURY ADAPTATIONS** in prompt: lombar/joelho/ombro/cotovelo/punho/cervical/quadril → exercises to remove + safe substitutes
**POSTURE DEVIATIONS**: hipercifose, hiperlordose, joelho valgo, pescoço anteriorizado, escápula alada → priorities/avoidances

**Phase 2 pending**: ênfase corporal field in quiz; 3 confirmation questions (split/cardio/meal times) between body assessment accept and protocol generation; 60-day re-analysis flow with pain/injury check.
