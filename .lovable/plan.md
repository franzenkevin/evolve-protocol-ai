# Quiz Evoria — funil completo estilo MyFitCoach

Vou criar um funil de quiz longo (33 etapas) em `/quiz`, no mesmo modelo das referências MyFitCoach, mas com a identidade visual Evoria (fundo preto, accent **lime green #22c55e**, Space Grotesk/Inter, copy PT-BR persuasiva). A landing atual permanece em `/` e ganha apenas um botão "Iniciar quiz" que leva para `/quiz`.

## Estrutura do funil

1. **Landing leve** (`/`) — mantém o que já existe, adiciona seção curta "Como funciona" + CTA grande "Iniciar quiz grátis".
2. **Quiz `/quiz`** — header com logo Evoria, barra de progresso `X/33`, botão voltar, transições suaves. Estados salvos em `sessionStorage`.

### Etapas (espelhando suas 33 telas)
1 Gênero · 2 Idade (faixa) · 3 Prova social · 4 Objetivo · 5 Forma corporal atual · 6 Forma corporal alvo · 7 Frequência atual de treino · 8 Histórico fitness · 9 Padrão de peso · 10 Frequência desejada · 11 Duração ideal de treino · 12 Horário preferido · 13 Local de treino · 14 Tipo de academia · 15 Divisão de treino preferida · 16 Gráfico de progresso (visual) · 17 Músculos prioritários · 18 Lesões/limitações · 19 Motivação principal · 20 Tentativas anteriores · 21 Dia típico · 22 Nível de energia · 23 Sono · 24 Água · 25 Insight de desistência · 26 % gordura corporal (slider visual) · 27 Altura · 28 Peso atual + IMC · 29 Peso alvo · 30 Idade exata · 31 Perfil de aptidão (resumo) · 32 Evento-alvo · 33 Data do evento + confiança.

### Prévia do protocolo (grátis, gera curiosidade)
- Tela de loading "Criando seu protocolo…" com prova social rolando.
- **Prévia**: divisão de treino, calorias/macros estimados, estratégia em 3 bullets, gráfico de musculatura 4 semanas, comparativo "Agora → Objetivo".

### Análise física por IA (opcional, antes da oferta)
- Tela "Quer uma prévia de avaliação postural por IA?" com upload de 2-3 fotos (frente/lado/costas) — opcional, botão "Pular".
- Edge function `analyze-physique` usa **Lovable AI Gateway** (`google/gemini-2.5-pro` visão) para devolver: postura, simetria, pontos a desenvolver, recomendação inicial — em formato resumido para gerar curiosidade.

### Oferta / Paywall
- Captura de email (lead).
- Tela "Escolha o melhor plano para você" com 3 opções (1/3/6 meses), timer de desconto 10min, comparativo de preço/dia.
- Garantia 30 dias, depoimentos, FAQ leve, footer.
- CTA leva para checkout existente (Stripe).

## Identidade Evoria aplicada
- Fundo `#000`, cards `bg-card/60` com blur, accent lime `#22c55e` (botões, destaques, barra de progresso, gráficos), nunca o azul-claro do MyFitCoach.
- Tipografia: Space Grotesk títulos / Inter corpo.
- Botões grandes, full-width, radius generoso, sem poluição.
- Copy PT-BR forte e persuasiva ("Seu protocolo já está sendo desenhado", "Resultado visível em 4 semanas", etc.).

## Detalhes técnicos
- Nova pasta `src/components/quiz/` com `QuizLayout`, `QuizProgress`, `QuizOption`, `QuizSlider`, `QuizNumberInput`, `QuizDatePicker`, `QuizPhysiqueUpload`.
- `src/pages/Quiz.tsx` controla step atual + estado via reducer.
- `src/lib/quizSteps.ts` define o array de 33 etapas (config-driven, fácil de editar copy depois).
- Estado persistido em `sessionStorage` para o usuário poder recarregar.
- Análise IA: edge function `analyze-physique` + upload temporário para storage `quiz-physique` (RLS aberto só por session token, expira em 24h).
- Geração do protocolo real continua acontecendo **depois do pagamento** (regra já estabelecida).

## Fora do escopo
- Não vou mexer no protocolo real, dashboard, treino, dieta ou admin.
- Não vou trocar a identidade da landing atual além do CTA de quiz.
- Análise por IA é apenas "prévia" — gera relatório curto, não substitui a avaliação completa pós-pagamento.

Confirma que posso seguir com isso?
