# Evoria app

1) O que é o coração do Hypertrophy

O núcleo real do seu app é este:

Autenticação

 login

 cadastro apenas de clientes aprovados/pagos

 recuperação de senha

 onboarding inicial

Motor de protocolo

 coleta de dados

 geração de treino

 geração de dieta

 substituições alimentares

 revisão do protocolo

 renovação a cada 60 dias

Área do aluno

 dashboard

 treino

 dieta

 avaliação

 progresso

 uploads de fotos

 vídeos de exercícios

 check-ins

 news / newsletter

 gamificação

 indicações / cashback

Backoffice seu

 painel admin

 biblioteca de exercícios

 biblioteca de alimentos

 regras da sua metodologia

 aprovar ou bloquear protocolos

 revisar clientes com baixa aderência

 revisar fotos e evoluções

 controlar planos e pagamentos

Sem esse painel seu, o app fica fraco. Porque a IA até gera, mas o ativo principal é a sua lógica de decisão.

2) O maior ponto técnico: a IA não pode ser “solta”

O melhor modelo para esse app não é:

 usuário responde

 IA inventa treino

 IA inventa dieta

 pronto

O melhor modelo é:

 usuário responde

 sistema converte respostas em variáveis estruturadas

 seu motor de regras filtra possibilidades

 IA monta a proposta final dentro dos limites que você definiu

 sistema mostra protocolo

 usuário aceita ou pede ajuste

 dependendo do caso, cai para revisão manual

Ou seja: regra primeiro, IA depois.

Isso muda tudo, porque evita:

 treino incoerente

 dieta incompatível com restrição

 substituição alimentar ruim

 progressões sem lógica

 alterações arriscadas por interpretação errada

3) O que eu construiria primeiro

Fase 1 — MVP funcional real

Essa é a versão que você deveria lançar primeiro.

Telas:

 login

 cadastro restrito

 onboarding / questionário

 dashboard

 treino

 dieta

 progresso

 uploads de fotos

 biblioteca de exercícios com vídeo

 perfil

 notificações

Funcionalidades:

 geração inicial de treino

 geração inicial de dieta

 substituições simples

 histórico de protocolos

 check-in manual

 troca de protocolo após 60 dias

 painel admin para você editar tudo

Sem colocar ainda:

 cashback

 gamificação complexa

 marketplace de exames

 contratação interna de especialista

 análise automática avançada de exames

 protocolo hormonal automatizado

Porque isso tudo aumenta complexidade, custo e risco.

Fase 2 — IA de progressão e aderência

Depois que o MVP estiver rodando:

 leitura das respostas do check-in

 comparação entre protocolo anterior e novo

 análise de aderência

 análise visual inicial das fotos

 sugestão de próximo protocolo

 justificativa do ajuste em linguagem clara

Fase 3 — monetização expandida

Só depois:

 cashback por indicação

 newsletter personalizada

 news feed

 ranking / gamificação

 área de upsell de exames

 contratação de especialista

4) O fluxo ideal do usuário

Entrada

 Cliente paga fora ou dentro da plataforma

 Conta é liberada

 Faz login

 Responde onboarding

 Envia fotos

 Sistema gera protocolo inicial

 Usuário aprova ou pede ajuste

 Protocolo entra em execução

Durante o ciclo

 acompanha treino

 acompanha dieta

 vê vídeos

 marca execução

 registra peso

 registra adesão

 recebe notificações

 consome news/newsletter

No dia 60

 envia novas fotos

 atualiza peso, rotina, adesão e percepção

 IA compara evolução

 sugere novo protocolo

 usuário aprova ou pede refinamento

Esse fluxo está bom porque ele é simples e muito forte comercialmente.

5) O que precisa estar “hardcoded” na sua metodologia

Antes de qualquer código, você precisa transformar sua metodologia em blocos objetivos.

Treino

Você precisa definir:

 tipos de aluno

 iniciante

 intermediário

 avançado

 objetivos

 hipertrofia

 emagrecimento

 recomposição

 frequência semanal

 2, 3, 4, 5, 6 dias

 contexto

 academia completa

 academia limitada

 casa

 restrições

 dor no joelho

 dor no ombro

 lombar

 padrão de divisão

 full body

 upper/lower

 push/pull/legs

 híbridos

 regra de volume

 regra de progressão

 regra de falha / RIR

 regra de substituição de exercício

 regra de deload

 regra de troca em 60 dias

Dieta

Você precisa definir:

 cálculo base calórico

 distribuição de macros

 ajuste por objetivo

 ajuste por sexo

 ajuste por rotina

 ajuste por fome / saciedade

 alimentos-base

 alimentos preferidos

 alimentos excluídos

 substituições equivalentes

 refeições livres

 restrições e alergias

 lógica de aderência

Sem isso, a IA vira um “gerador bonito”, mas não um sistema seu.

6) Como eu dividiria a arquitetura

App do aluno

React Native com Expo

 mais rápido para iPhone e Android

 custo menor

 boa velocidade de validação

Painel admin

Next.js

 painel web para você e sua equipe

 gestão de clientes, protocolos, biblioteca, pagamentos e flags

Backend

Supabase ou Firebase

 autenticação

 banco

 storage de fotos e exames

 notificações e funções server-side

Eu tenderia a Supabase para esse projeto, porque o modelo relacional ajuda mais quando você terá:

 usuários

 protocolos

 versões de protocolo

 exercícios

 alimentos

 preferências

 uploads

 planos

 indicações

 comissionamento

IA

 camada separada de orquestração

 recebe dados limpos do banco

 consulta suas regras

 gera resposta estruturada

 salva no banco

 sinaliza casos para revisão

7) Onde a IA entra de verdade

A IA deve atuar em 6 frentes:

parser do onboarding

 transformar respostas em estrutura

geração de treino

 dentro da sua metodologia

geração de dieta

 com macros, refeições e substituições

explicação

 explicar para o aluno por que recebeu aquele protocolo

revisão de progresso

 usar check-in + fotos + peso + aderência

ajuste conversacional

 quando o aluno disser “não gostei”, “quero mais peito”, “esse exercício me incomoda”, etc.

Com imagens, a API atual aceita esse tipo de entrada, então dá para usar fotos do aluno como parte do fluxo de análise, desde que você trate isso como sugestão assistida e não como diagnóstico absoluto.

8) O que eu não automatizaria totalmente

Aqui está o ponto mais importante.

Eu não colocaria a IA para:

 prescrever hormônios automaticamente

 recomendar peptídeos automaticamente

 interpretar exames como decisão final clínica

 decidir condutas médicas sem revisão

 prometer diagnóstico por foto

 prometer avaliação postural médica automática

Isso é onde o app pode ficar perigoso e juridicamente frágil.

O modelo mais seguro é:

treino e dieta: podem ser fortemente automatizados

exames: triagem + organização + resumo

hormônios / peptídeos: apenas fluxo de solicitação e revisão humana especializada

fotos: análise de progresso física/estética/aderência, não diagnóstico clínico

9) Parte jurídica e de risco

Você vai tratar:

 dados cadastrais

 fotos corporais

 dados de saúde

 exames

 possivelmente informações hormonais e medicamentosas

Isso entra em zona sensível de proteção de dados. A LGPD regula o tratamento de dados pessoais em meios digitais, e dados de saúde são tratados como dados sensíveis, exigindo cuidado reforçado com finalidade, segurança, retenção e governança.

Então, no mínimo, o app precisa nascer com:

 política de privacidade séria

 termo de uso

 termo de consentimento para fotos e exames

 controle de acesso por perfil

 criptografia em trânsito e em repouso

 logs de alteração

 política de retenção e exclusão

 separação clara entre conteúdo fitness e conduta clínica

 fluxo explícito de revisão humana para temas médicos

10) Como transformar sua ideia em produto sem saber programar

Você tem dois caminhos.

Caminho A — validar rápido

Você monta primeiro:

 Figma

 documentação do produto

 regras da metodologia

 wireframes

 fluxo de onboarding

 banco inicial de exercícios

 banco inicial de alimentos

 prompts e regras da IA

 protótipo navegável

Depois entrega para dev.

Caminho B — construir com IA + dev parcial

Você usa IA para:

 gerar telas

 gerar banco

 gerar APIs

 gerar painel admin

 gerar fluxo de onboarding

 gerar integrações

Mas ainda vai precisar de alguém para:

 organizar arquitetura

 autenticação

 storage

 segurança

 deploy

 revisão de código

 bugs

 publicação

Ou seja: sozinho, com IA, você consegue montar muito.
Mas para publicar algo robusto com dados de saúde, o ideal é ter ao menos um dev full-stack bom ou uma software house enxuta.

11) Ordem exata que eu seguiria agora

Etapa 1 — Produto

Definir em documento:

 proposta do app

 público

 planos

 fluxos

 telas

 regras da metodologia

 regras de IA

 limites de automação

 regras de segurança

Etapa 2 — Método

Transformar sua consultoria em bases estruturadas:

 árvore de decisão de treino

 árvore de decisão de dieta

 biblioteca de substituições

 regras de progressão

 regras de revisão de 60 dias

Etapa 3 — Protótipo

Fazer no Figma:

 login

 onboarding

 dashboard

 treino

 dieta

 progresso

 upload de fotos

 revisão de protocolo

 news

 perfil

Etapa 4 — MVP técnico

Construir:

 app

 backend

 painel admin

 biblioteca

 geração de protocolo

 armazenamento de imagens

 controle de usuários

Etapa 5 — IA de verdade

Só depois integrar:

 parsing

 recomendação

 análise de evolução

 ajuste conversacional

12) Minha opinião direta

Sua ideia é boa.
Mas hoje ela está misturando três produtos em um:

app de consultoria fitness

motor de prescrição com IA

plataforma health-tech com exames e especialistas

Se você tentar lançar tudo junto, a chance de travar é alta.

O movimento certo é:

primeiro construir o app de consultoria com geração de treino e dieta,
depois adicionar revisão por IA,
e só por último abrir a vertical de exames, especialistas e condutas clínicas.

Esse é o caminho mais barato, mais rápido e mais seguro.

13) O que eu faria por você agora, na sequência lógica

Eu seguiria assim:

 montar o escopo MVP completo

 depois quebrar em telas

 depois quebrar em banco de dados

 depois quebrar em prompts e regras da IA

 e por fim te entregar o plano técnico de desenvolvimento

Posso começar já pelo escopo MVP tela por tela do Hypertrophy, em português, com estrutura pronta para você passar para dev ou usar no Figma.

Desenvolva uma escrita para eu colocar na suíte do Google para ele criar todo esse aplicativo. Ele está criando com alguns erros, então descreva tudo o que cabe lá dentro para eu colocar pra ele fazer esses ajustes e integrar uma tela com a outra, pois as telas não estão integrando muito bem. Descreva tudo para ele novamente.

Perfeito — aqui o problema não é “ideia”, é especificação mal estruturada.
Se você não for extremamente claro, o Google AI Studio / Firebase Studio vai criar telas soltas, sem estado global, sem navegação consistente e sem integração de dados.

Vou te entregar um prompt técnico completo, no formato certo para colar direto na suíte do Google.

📲 PROMPT COMPLETO – APP “HYPERTROPHY”

🧠 CONTEXTO GERAL

Crie um aplicativo mobile chamado Hypertrophy, focado em consultoria fitness personalizada com IA.

O aplicativo deve ser:

 100% funcional (não apenas visual)

 Com navegação fluida entre telas

 Com estado global persistente do usuário

 Com integração completa entre dados (onboarding → protocolo → evolução)

 Com backend conectado (auth + banco + storage)

 Com arquitetura escalável

⚠️ PROBLEMA ATUAL A SER CORRIGIDO

O app atualmente apresenta:

 Telas desconectadas

 Falta de fluxo entre onboarding e dashboard

 Dados não sendo persistidos

 Navegação quebrada

 Falta de integração entre treino, dieta e usuário

OBJETIVO:

Corrigir isso implementando:

 Navegação estruturada

 Estado global centralizado

 Banco de dados integrado

 Fluxo completo do usuário

🧱 ARQUITETURA OBRIGATÓRIA

Frontend:

 React Native (Expo)

Backend:

 Firebase (Auth + Firestore + Storage)

Estado global:

 Context API ou Zustand

Navegação:

 React Navigation com:

 Stack Navigator (fluxo inicial)

 Bottom Tab Navigator (app principal)

🔐 AUTENTICAÇÃO

Criar sistema completo:

 Login

 Cadastro

 Logout

 Persistência de sessão

Fluxo:

 Usuário NÃO logado → tela de login

 Usuário logado → dashboard

🧾 ONBOARDING (OBRIGATÓRIO E INTEGRADO)

Após login, se o usuário não tiver onboarding completo:

Redirecionar automaticamente para onboarding.

Perguntas obrigatórias:

 Nome completo

 Idade

 Sexo

 Peso

 Altura

 Objetivo

 Nível de atividade (sedentário → ativo)

 NEAT (rotina diária)

 Dias de treino

 Experiência

 Tipo de academia

 Lesões/dor

 Alimentos que gosta (multi-select)

 Alimentos que não gosta (texto)

 Alergias

 Horas de sono

 Nível de estresse

IMPORTANTE:

Salvar tudo no Firestore na coleção:

users/{userId}/profile

🔁 TRANSIÇÃO CRÍTICA (ERRO ATUAL)

Após finalizar onboarding:

👉 Gerar automaticamente:

 Treino

 Dieta

👉 Salvar como:

users/{userId}/protocols/current

👉 Redirecionar para:
Dashboard

📊 DASHBOARD (TELA PRINCIPAL)

Deve puxar dados reais do banco:

Mostrar:

 Nome do usuário

 Protocolo atual

 Dias de treino da semana

 Resumo da dieta

 Último check-in

 Botões rápidos para:

 Treino

 Dieta

 Avaliação

 Protocolo

📱 NAVEGAÇÃO PRINCIPAL (BOTTOM TAB)

Criar abas fixas:

 Início (Dashboard)

 Treino

 Dieta

 Avaliação

 Protocolo

 Perfil

🏋️ TREINO

 Puxar treino do banco

 Estrutura por dia

 Lista de exercícios

 Cada exercício com:

 Nome

 Séries

 Reps

 Vídeo (mock inicialmente)

 Permitir marcar como concluído

Salvar progresso.

🥗 DIETA

 Exibir refeições do dia

 Mostrar macros

 Lista de alimentos

 Sistema de substituição simples

📸 AVALIAÇÃO

 Upload de fotos:

 Frente

 Lado

 Costas

Salvar no Firebase Storage.

Salvar referência no Firestore.

🔁 PROTOCOLO (LÓGICA DE 60 DIAS)

Mostrar:

 Data de início

 Data de troca (60 dias)

Se passar 60 dias:

👉 Liberar botão:
"Gerar novo protocolo"

Fluxo:

 Atualizar dados (peso, rotina)

 Enviar novas fotos

 Gerar novo protocolo

 Salvar histórico

👤 PERFIL

 Editar dados

 Ver plano

 Logout

🧠 IA (INTEGRAÇÃO)

Criar função:

generateProtocol(userData)

Entrada:

 Dados do onboarding

Saída:

 Estrutura JSON com:

 Treino

 Dieta

Salvar no banco.

🔄 ESTADO GLOBAL (CRÍTICO)

Criar store global contendo:

 user

 profile

 currentProtocol

 loading states

TODAS as telas devem consumir esse estado.

🚫 ERROS A EVITAR

NÃO fazer:

 Telas isoladas sem conexão

 Dados mockados fixos

 Navegação manual sem lógica

 Falta de persistência

 Falta de redirecionamento automático

✅ RESULTADO ESPERADO

O app deve funcionar assim:

 Login

 Onboarding (se necessário)

 Geração automática de protocolo

 Redirecionamento para dashboard

 Navegação fluida entre abas

 Dados sincronizados em tempo real

 Evolução salva corretamente

🔥 PRIORIDADE

 Corrigir navegação

 Corrigir integração entre telas

 Garantir persistência de dados

 Garantir fluxo completo do usuário

🧩 INSTRUÇÃO FINAL

Implemente tudo de forma conectada, funcional e escalável.

Não gerar apenas layout.
Gerar aplicação funcional com fluxo completo e dados integrados.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://evolve-protocol-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5acd8e1-618e-400a-b85d-e21966eecfc6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
