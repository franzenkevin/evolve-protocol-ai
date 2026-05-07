---
name: AI Protocol Generation Methodology
description: Official Hypertrophy methodology — splits (M/F 2-7x), volumes, set schemes, advanced techniques, abs/peito rules, ondulatory periodization
type: feature
---
**Source of truth**: `src/lib/workoutRules.ts` (used by both AI prompt and local fallback `generateProtocol.ts`)

**Splits oficiais**:
- Mulheres: 2x FB-FB ênfase inferior | 3x FB-FB-FB ênfase inferior (default) ou Inf(quad)-Sup-Inf(post+glúteo) | 4x Inf-Sup-Inf-Sup (default) ou Inf-Sup-Inf(post)-Sup+glúteo | 5x alternado (default) ou com OFF | 6x alternado | 7x = 6x + 1 complementar
- Homens: 2x FB-FB | 3x PPL (default) ou FB-FB-FB | 4x Upper-Lower (default) ou PPL+Upper | 5x LPPLU (default) ou Push1-Pull1-Legs-Push2-Pull2 | 6x PPLx2 com ênfases distintas

**Regras universais**:
- Abdômen 2x/semana distribuído nos dias de treino, APENAS reto + prancha (NUNCA oblíquo — aumenta cintura)
- Mulher: máx 1 exercício de peito/semana; ênfase superiores em **costas (largura) + ombro (lateral+posterior) para formato V e ilusão de cintura fina**, mas TÉCNICO e SEM exagerar volume (meio-baixo da faixa); inferiores com **prioridade GLÚTEO MÉDIO** (abdução, clamshell, hip thrust com rotação externa, sumô com mini-band — déficit comum); sempre cruzar com individualidade do aluno
- Homem: anti-overtraining — preferir meio-baixo da faixa para iniciante/intermediário; mensagem em dynamicNotes
- Treino em casa: superior/inferior ou fullbody, peso do corpo + elásticos

**Séries válidas por nível (REGRA DE PROGRESSÃO)**:
- Iniciante: 2 válidas (última na falha), 0 técnicas avançadas
- **Intermediário: também 2 válidas (última na falha)** — NUNCA começar com 3, deixar espaço para progredir; pode 1 técnica pontual quando justificável
- Avançado: 3 válidas (última na falha) OU 2 + técnica avançada (drop/rest-pause/cluster); técnicas em até 30-40% dos exercícios
- Progressão natural: dominar 2 válidas → adicionar 3ª série OU técnica avançada

**Periodização ondulatória (oficial)**:
- v1=mediano → v2=alto → v3=baixo (deload) → oscilar
- Edge function `generate-protocol` carrega último protocolo do user e passa resumo no prompt (campo `previousProtocol`)
- Trocar 30-50% dos exercícios entre ciclos, variar zona de reps (5-9 / 6-10 / 8-12 / 10-15)

**Confirmation flow**:
- `ProtocolConfirmation.tsx` agora exibe RadioGroup com TODAS as variantes de split disponíveis (default marcada com ⭐)
- Variante escolhida é enviada como `confirmations.split.chosenVariant` para edge function

**Volume counting rule**: 1 série = 1.0 principal + 0.5 acessório. Aquecimentos NÃO contam. Backoffset NÃO conta. Cluster set conta como 1.

**Cardio integrado**: mesma tela dos treinos (campo cardio por dia + cardioPlan). Se cardio_enabled=false, omitir.

**INJURY ADAPTATIONS** + **POSTURE DEVIATIONS**: tabelas no system prompt da edge function generate-protocol.
