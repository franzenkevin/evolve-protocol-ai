## Objetivo

Garantir que **todo navegador que já visitou o EVORIA** receba a versão nova automaticamente na próxima abertura, sem o usuário precisar limpar nada.

## Diagnóstico do que já existe

O projeto já tem 3 mecanismos de auto-limpeza, mas eles têm furos:

1. `public/sw.js` — service worker auto-destrutivo (limpa caches + se desregistra). ✅ OK
2. `index.html` — manda `Cache-Control: no-cache`. ✅ OK
3. `src/main.tsx` — chama `clearAppCaches()` e detecta build novo. ⚠️ Tem bugs:
   - O `APP_BUILD_ID` está em `2026-04-19` (desatualizado) — então usuários antigos não disparam o hard-reload de versão.
   - O hard-reload roda **depois** do React renderizar — o usuário vê a tela antiga por 1-2s.
   - Não força o navegador a re-baixar `sw.js` (que pode estar cacheado pelo SW antigo).

## Causa raiz do problema do usuário

Quando o navegador antigo abre o site:
- O SW antigo (vite-plugin-pwa) intercepta a request do HTML e serve a **versão cacheada antiga**.
- Como o HTML antigo aponta para `assets/index-XXXX.js` antigos, o usuário vê o visual antigo.
- O SW novo (`sw.js`) só executa se o navegador conseguir buscá-lo — mas o SW antigo pode estar respondendo o próprio `sw.js` pelo cache.

## Mudanças que vou fazer

### 1. Atualizar `APP_BUILD_ID` em `src/main.tsx`
Trocar para a data de hoje (`2026-04-27T16:30Z`). Isso dispara o hard-reload de uma vez para todo mundo que já visitou.

### 2. Tornar a limpeza síncrona e mais agressiva em `src/main.tsx`
- Detectar build antigo **antes** de renderizar o React.
- Se detectar SW antigo registrado, fazer `unregister()` + `caches.delete()` + `location.reload(true)` antes de qualquer renderização.
- Forçar `navigator.serviceWorker.register('/sw.js?v=BUILD_ID', { updateViaCache: 'none' })` para garantir que o `sw.js` novo (auto-destrutivo) seja baixado da rede.

### 3. Adicionar headers anti-cache no `vercel.json`
Adicionar regras de headers para:
- `/sw.js` e `/registerSW.js` → `Cache-Control: no-cache, no-store, must-revalidate` (para que o navegador sempre busque a versão fresca).
- `/index.html` e `/` → `Cache-Control: no-cache` no nível do CDN.
- `/manifest.json` → `no-cache`.

Isso fecha o último furo: o CDN/navegador para de servir `sw.js` cacheado.

### 4. Bumpar o nome do `sw.js` via query param no registro
No `main.tsx`, registrar `/sw.js?build=2026-04-27` força o navegador a tratar como SW novo (URL diferente) e descartar o antigo.

## Resultado

Após o deploy:
- **Visitante antigo** abre o app → CDN entrega `index.html` fresco (header no-cache) → JS novo executa → detecta SW antigo → desregistra + limpa caches + recarrega → vê EVORIA novo. Tudo em ~1 segundo, **sem ação do usuário**.
- **Próximas atualizações** nunca mais terão esse problema porque o `sw.js` auto-destrutivo já está rodando e não há mais SW de cache ativo.

## Arquivos editados

- `src/main.tsx` — bump build ID + lógica de limpeza síncrona pré-render.
- `vercel.json` — adicionar bloco `headers` para `sw.js`, `index.html`, `manifest.json`.

## Após aprovar

Você precisa clicar em **Publish → Update** depois que eu aplicar as mudanças, porque é alteração de frontend e só vai pro ar publicado depois disso.