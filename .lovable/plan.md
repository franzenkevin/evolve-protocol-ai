
## Diagnóstico

O usuário está vendo divergência entre **preview** (`id-preview--*.lovable.app`) e **publicado** (`evolve-protocol-ai.lovable.app`):
- Login do preview tem opções novas (admin), publicado não tem
- Dashboard do aluno publicado não tem todas as opções do preview

### Causa raiz

**Não é o banco de dados.** Ambos os ambientes usam o mesmo Supabase (`wrxddctlyyiqgetiwdpu.supabase.co`) — confirmado pelos logs/network. RLS, tabelas, edge functions são compartilhadas.

**O problema é frontend não publicado + cache de Service Worker antigo.**

Em Lovable:
- **Backend (edge functions, migrations)** → deploya automaticamente em ambos os ambientes
- **Frontend (React/UI)** → só vai pro `.lovable.app` publicado quando o usuário clica em **Publish → Update**

Como fizemos várias mudanças de UI nas últimas mensagens (Login, Dashboard, Onboarding, Sidebar admin, etc.), o `evolve-protocol-ai.lovable.app` está rodando o **bundle JS antigo** porque ninguém clicou em "Update" depois das mudanças.

**Agravante**: existia (e ainda pode estar cacheado nos navegadores) um Service Worker (`sw.js`) de uma versão antiga do PWA que servia assets em cache mesmo quando você atualizasse. Já foi neutralizado em `public/sw.js` (self-destroying), mas dispositivos que visitaram o publicado antes ainda podem ter o SW antigo ativo até a próxima visita.

### Verificação

Vou confirmar o status de publicação para garantir que não há nada bloqueando.

```text
Preview (id-preview--*)         Publicado (.lovable.app)
        │                                │
        ├── Frontend = código atual      ├── Frontend = última build do Publish
        │                                │
        └── Backend ─────► Supabase ◄────┘  (mesmo banco, mesmas funções)
```

## Plano de ação

### 1. Confirmar status de publicação
Checar `publish_settings` para confirmar que o app está público e não há bloqueio de visibilidade.

### 2. Forçar republicação (ação do usuário)
Você precisa clicar em **Publish → Update** no canto superior direito do editor Lovable. Isso reconstrói o frontend e envia para `evolve-protocol-ai.lovable.app`. Sem essa ação, o publicado fica congelado na última build.

### 3. Garantir invalidação de cache em dispositivos antigos
O `public/sw.js` atual já é "self-destroying" (desinstala e limpa caches no primeiro load). Vou:
- Adicionar versionamento explícito no `index.html` (meta tag `app-build`) e no header da requisição para forçar bypass de cache HTTP no `index.html`
- Adicionar um pequeno script no `main.tsx` que detecta build antigo e força `location.reload(true)` se o `data-app-build` mudou entre visitas (já existe parcialmente — vou consolidar)

### 4. Documentar o fluxo (sem código)
Deixar claro pra você: **toda alteração de UI exige clicar em Publish → Update** depois. Mudanças de banco/edge function não exigem.

## Arquivos que serão tocados (na fase de implementação)

- `index.html` — adicionar meta `app-build` e cache-control
- `src/main.tsx` — consolidar lógica de detecção de versão e reload automático
- (nenhuma migration, nenhuma edge function — banco está OK)

## Resultado esperado

- Após você clicar em **Publish → Update**, o publicado terá exatamente o mesmo frontend do preview
- Dispositivos com SW antigo se autocorrigirão no primeiro carregamento (já implementado)
- Próximas publicações não vão mais "grudar" em cache antigo
