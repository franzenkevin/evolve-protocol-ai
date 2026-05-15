# Compartilhar treino nos Stories

Ao finalizar um treino, o aluno gera uma arte 1080x1920 com seus dados e compartilha direto no Instagram Stories via deep link nativo (com fallback para download).

## Como vai funcionar (fluxo do usuário)

1. Aluno termina o último exercício em `/training` → aparece um botão **"Compartilhar treino"** (e também no card de resumo após salvar).
2. Abre um modal com:
   - **Preview da arte** (1080x1920, escala reduzida) gerada em tempo real
   - Botão opcional **"Adicionar minha foto"** (input file `accept="image/*" capture="user"` — abre câmera ou galeria)
   - Botão principal **"Compartilhar nos Stories"**
   - Botão secundário **"Baixar imagem"** (fallback)
3. Toque em compartilhar:
   - **Mobile com Instagram instalado**: tenta `instagram-stories://share?...` (iOS/Android) com a imagem como `backgroundImage` via Web Share API + fallback de deep link
   - **Sem Instagram / desktop**: dispara `navigator.share()` com o PNG, ou faz download direto

## Conteúdo da arte (estilo Dark Premium)

Layout vertical 1080x1920, fundo `#090B11` com gradiente sutil para `#0F121B`:

```
┌─────────────────────┐
│   [logo Evoria]     │ ← topo, 80px, branco
│                     │
│   [foto opcional    │ ← se enviada: ocupa 60% com overlay
│    do usuário ou    │   escuro 70% e blur leve nas bordas
│    pattern teal]    │
│                     │
│  TREINO CONCLUÍDO   │ ← Space Grotesk 56px, teal #00C4B3
│                     │
│  Treino A           │ ← nome do dia, 64px, branco
│  Peito e Tríceps    │
│                     │
│  ┌──────┬──────┐    │
│  │4.250 │  18  │    │ ← cards de métrica
│  │  KG  │SÉRIES│    │   teal accent, 96px números
│  └──────┴──────┘    │
│  ┌─────────────┐    │
│  │   52 MIN    │    │
│  └─────────────┘    │
│                     │
│   evoriacoach.com   │ ← rodapé pequeno, muted
└─────────────────────┘
```

Tipografia: **Space Grotesk** (números/títulos) + **Inter** (labels), carregadas via Google Fonts antes do render.

## Arquivos a criar/editar

**Novos:**
- `src/lib/storyImage.ts` — função `generateStoryImage(data): Promise<Blob>` que monta o PNG via `<canvas>` 1080x1920. Recebe `{ workoutName, totalVolume, totalSets, durationMin, userPhoto?, logoUrl }`.
- `src/lib/shareToInstagram.ts` — função `shareStory(blob)`:
  1. Tenta `navigator.share({ files: [new File([blob], 'treino.png', { type: 'image/png' })] })` (cobre Instagram, WhatsApp, etc no menu nativo do iOS/Android)
  2. Fallback: `<a download>` para baixar a imagem
- `src/components/ShareWorkoutDialog.tsx` — modal com preview, upload de foto opcional, botões compartilhar/baixar.

**Editar:**
- `src/pages/Training.tsx` — adicionar botão "Compartilhar treino" no card de resumo / ao concluir; calcular `totalVolume = Σ(weight × reps)` e `totalSets` a partir dos `workout_logs` do dia; estimar `durationMin` (diferença entre primeiro e último set salvo, ou registrar `startedAt` no início).
- (Opcional) `src/hooks/useWorkoutLogs.ts` — helper `summarizeDay(logs)` retornando volume/séries/duração para reaproveitar.

**Asset:**
- Usar `src/assets/evoria-logo-horizontal.png` (já existe) carregado em `<img>` antes de desenhar no canvas.

## Detalhes técnicos importantes

**Geração no canvas (não usa servidor, sem custo):**
```ts
const canvas = new OffscreenCanvas(1080, 1920);
const ctx = canvas.getContext('2d');
// 1. fundo + gradiente
// 2. carregar foto do usuário (se houver) e desenhar com clip arredondado + overlay
// 3. carregar logo (Image promise)
// 4. await document.fonts.load('700 96px "Space Grotesk"')
// 5. desenhar textos
// 6. canvas.convertToBlob({ type: 'image/png' })
```

**Por que não publica 100% automático:** Instagram não expõe API pública de Stories para contas pessoais. O deep link `instagram-stories://share` exige que o app esteja instalado e mostra preview antes de publicar (1 toque do usuário). Web Share API é o caminho mais universal e já dá UX excelente — o usuário toca em "Instagram" no menu nativo e a imagem entra direto como sticker.

**Duração do treino:** persistir `workoutStartedAt` em `localStorage` quando o primeiro set do dia é salvo, e calcular diff ao finalizar. Sem alteração de banco.

**Sem mudanças no banco** — todos os dados (volume, séries) já existem em `workout_logs`.

## Fora de escopo

- Publicação 100% automática sem toque do usuário (impossível pelas regras das redes)
- Suporte a TikTok/Facebook nesta primeira versão (focado só em Instagram + menu nativo de fallback)
- Salvar histórico de stories compartilhados (pode virar feature futura para gamificação)

## Estimativa de esforço

Pequeno-médio: ~3 arquivos novos + 1 edição em Training.tsx. Nada de backend, edge function ou migração.
