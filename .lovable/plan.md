
## Mudanças no Admin → Journal

### 1. Remover botão "Gerar 5 artigos" (lote)
- Em `src/components/admin/AdminJournal.tsx`: remover o Card "Gerar lote automático" (linhas 263-279), o estado `batchLoading`, a função `handleBatchGenerate` e o import não usado `supabase` da invocação.
- Deletar a edge function `supabase/functions/journal-batch-generate/` (não será mais chamada).

### 2. Mudar fluxo de "Pesquisar com IA" para retornar 3 opções do Google Acadêmico
Hoje: digita tema → IA gera **1 rascunho** direto.
Novo: digita tema → IA pesquisa no **Google Scholar** → retorna **3 sugestões** com título do estudo + resumo curto + link/DOI da referência → admin escolhe uma → IA expande em artigo completo já com a fonte preenchida.

### 3. Alterações técnicas

**Edge function `journal-research`** (refatorar):
- Aceita 2 modos via body:
  - `{ topic }` → modo "buscar 3 opções": usa `tools: [{ type: "google_search" }]` com instrução explícita "pesquise no Google Scholar / scholar.google.com / PubMed" e retorna array de 3 objetos `{ angle, study_title, study_authors, study_year, study_url, short_pitch }` via tool-call `suggest_studies`.
  - `{ topic, selected: { study_title, study_url, short_pitch, ... } }` → modo "expandir": gera artigo completo (mesma estrutura atual: title/summary/excerpt/content/category/tags/read_time_minutes) **forçando `source_url = study_url`** e citando o estudo no corpo.
- Mantém validação de admin e tratamento de 429/402.

**Hook `useJournal.ts`**:
- Renomear/duplicar `useResearchJournalTopic` em duas mutations:
  - `useSearchJournalStudies(topic)` → retorna `JournalStudySuggestion[]`.
  - `useExpandJournalStudy({ topic, selected })` → retorna `JournalAIDraft` (igual ao atual).
- Novo tipo `JournalStudySuggestion`.

**`AdminJournal.tsx`** (UI):
- Substituir o input + botão "Gerar rascunho" por:
  1. Input do tema + botão "Buscar estudos" (chama `useSearchJournalStudies`).
  2. Quando volta, renderiza 3 Cards (cada um com título do estudo, autores/ano, pitch, link clicável da fonte) + botão "Gerar artigo deste estudo" em cada.
  3. Ao clicar, chama `useExpandJournalStudy` e abre o Dialog de edição preenchido (já com `source_url` da referência, `ai_sources` populadas, badge "Gerado por IA").
- Mantém todo o fluxo de edição/publicação/auditoria existente.

### 4. Garantias
- Fonte sempre obrigatória: o modo "buscar 3 opções" só aceita sugestões que tenham `study_url` válido (filtra no servidor).
- Se Google Search não devolver nada acadêmico, a edge retorna erro claro "Nenhum estudo encontrado, refine o tema" em vez de inventar.
- O `source_url` do artigo final = link do estudo escolhido (não pode ser editado em branco no submit).

### Arquivos afetados
```text
src/components/admin/AdminJournal.tsx        (refatorar UI)
src/hooks/useJournal.ts                       (novo hook + tipos)
supabase/functions/journal-research/index.ts  (2 modos)
supabase/functions/journal-batch-generate/    (DELETAR)
```

Sem mudanças em banco, RLS ou secrets — toda a infra já existe.
