
# Pop-up automático "Instalar como App" para usuários leigos

## Objetivo
Usuário leigo abre o site no celular e **automaticamente** vê um aviso bonito ensinando a instalar como app — sem precisar saber que isso existe.

## O que será criado

### 1. Componente `InstallPrompt` (banner flutuante)
Banner discreto que aparece **fixo no rodapé** do celular quando:
- Usuário está em dispositivo móvel (iOS ou Android)
- App ainda **não está instalado** (não está em modo standalone)
- Usuário **ainda não dispensou** o aviso (controle via localStorage)
- Já passou pelo menos **15 segundos** na primeira visita (não atrapalha)

Visual: card com ícone do app, texto "📱 Instale o EVORIA na tela inicial" + 2 botões: **"Instalar"** (primário) e **"Agora não"** (dispensa).

### 2. Modal de instruções (passo a passo visual)
Quando o usuário toca em **"Instalar"** no banner:

**Android**: dispara o instalador nativo do navegador (`beforeinstallprompt`) — instala com 1 toque.

**iOS**: abre um modal sobre a tela com tutorial visual ilustrado:
- Passo 1: ícone Compartilhar 􀈂 → "Toque no botão de compartilhar"
- Passo 2: ícone Adicionar 􀈎 → "Role e toque em 'Adicionar à Tela de Início'"  
- Passo 3: ícone OK ✓ → "Toque em Adicionar e pronto!"

Usa setas animadas pra indicar onde tocar. Botão "Já instalei" fecha tudo permanentemente.

### 3. Lógica de exibição inteligente
- Não aparece em **rotas internas críticas** (checkout, paywall, onboarding em andamento)
- Aparece em rotas públicas e no dashboard
- Se usuário dispensar 3 vezes → para de mostrar permanentemente
- Se dispensar 1 vez → reaparece após 7 dias
- Após **instalado** (detecta `appinstalled` event) → nunca mais aparece

### 4. Detecção de Instagram/Facebook in-app browser
Quando usuário clica num link do Instagram/WhatsApp/Facebook, o site abre no **navegador interno do app**, onde **não dá pra instalar PWA**. Nesse caso, o banner mostra mensagem diferente:
> "Para instalar, abra no Safari/Chrome — toque no menu (•••) → 'Abrir no navegador'"

### 5. Atualizar página `/install` existente
- Adicionar um vídeo curto/GIF demonstrativo (placeholder pra você adicionar depois)
- Garantir que continua acessível pelo menu do app

## Onde vai aparecer

| Local | Banner aparece? |
|---|---|
| Landing page (`/`) | ✅ Sim |
| Quiz/Onboarding | ❌ Não (atrapalha) |
| Paywall | ❌ Não |
| Dashboard, Treino, Dieta | ✅ Sim |
| Checkout em andamento | ❌ Não |
| Já instalado | ❌ Nunca |

## Arquivos que serão criados/editados

**Criar:**
- `src/components/InstallPrompt.tsx` — banner flutuante
- `src/components/InstallInstructionsModal.tsx` — modal com tutorial iOS
- `src/hooks/useInstallPrompt.ts` — lógica de detecção e estado

**Editar:**
- `src/App.tsx` — montar o InstallPrompt globalmente
- `src/pages/Install.tsx` — pequeno ajuste pra integrar com o novo modal

## Detalhes técnicos
- Usa evento `beforeinstallprompt` (Android/Desktop) para instalação automática
- Detecta `display-mode: standalone` e `navigator.standalone` (iOS) para saber se já está instalado
- Detecta in-app browsers via UserAgent (Instagram, FBAN, Line, etc.)
- Estado persistido em `localStorage` com chave versionada
- Animação suave de entrada (slide-up) usando Tailwind

## O que NÃO faz parte deste plano
- Notificações push (já está implementado separadamente)
- App nativo via Capacitor (decidimos manter PWA por enquanto)
- Vídeo tutorial gravado (você grava depois e me envia, eu encaixo)

---

**Resultado final**: usuário leigo abre o site no celular, depois de 15s vê um aviso bonito embaixo da tela: "Instale o EVORIA". Toca em **Instalar** → no Android instala sozinho, no iPhone vê o tutorial visual. Pronto. Zero conhecimento técnico necessário.
