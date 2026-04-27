## Objetivo

Criar a página `/instalar` com detecção automática de plataforma (iOS, Android, Desktop), botão de instalação nativa no Android e tutorial visual no iPhone.

## Arquivos

### 1. `src/pages/Install.tsx` (novo)

Página pública (sem login) com:

**Detecção automática de plataforma**
- Lê `navigator.userAgent` no `useEffect`.
- Detecta `iPad/iPhone/iPod` → iOS, `android` → Android, resto → Desktop.
- Detecta se já está instalado via `display-mode: standalone` ou `navigator.standalone`.

**Captura do prompt nativo PWA**
- Listener `beforeinstallprompt` salva o evento em estado.
- Listener `appinstalled` mostra toast de sucesso.

**UI**
- Header com logo EVORIA + botão voltar para `/`.
- Hero: "Tenha o EVORIA na tela inicial".
- Tabs (iPhone / Android / Computador) com a aba detectada selecionada por padrão (usuário pode trocar).
- Card "EVORIA já está instalado" se detectado.

**Conteúdo iOS (Safari)**
- Aviso: "Abra esta página no Safari".
- 3 passos numerados com ícones lucide:
  1. `Share` — Toque no botão Compartilhar
  2. `PlusSquare` — Adicionar à Tela de Início
  3. `CheckCircle2` — Toque em Adicionar
- Mock visual com a sequência de ícones.

**Conteúdo Android (Chrome)**
- Botão grande "Instalar EVORIA agora" que dispara `deferredPrompt.prompt()`.
- Botão fica desabilitado se o navegador ainda não disparou `beforeinstallprompt`.
- Passo a passo manual abaixo (3 pontinhos → Instalar app).

**Conteúdo Desktop**
- Mesmo botão de instalação nativa.
- Instruções para ícone na barra de endereço.

**Cards de benefícios** no fim: Acesso rápido / Tela cheia / Notificações.

Usa apenas tokens semânticos (primary, foreground, muted-foreground, card, border) — sem cores hardcoded.

### 2. `src/App.tsx` (editar)

- Importar `Install` de `./pages/Install`.
- Adicionar rotas públicas:
  - `/instalar` → `<Install />`
  - `/install` → redirect para `/instalar`

## Resultado

- Link compartilhável: `evolve-protocol-ai.lovable.app/instalar`
- Android com Chrome compatível: usuário aperta 1 botão → prompt nativo aparece.
- iOS: tutorial passo a passo visual (única solução possível — Apple não permite instalação automática).
- Funciona sem login, pode ser enviado por WhatsApp.