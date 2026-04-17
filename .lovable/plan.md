

User asks if the backend has everything already created. Let me check what's there vs what's needed, and also there are build errors in edge functions that need fixing.

Backend status check:
- Tables: admin_audit_log, body_assessments, checkins, coupons, coupon_redemptions, daily_ratings, diet_feedback, exercises, foods, journal_articles, live_meetings, plans, profiles, protocols, push_subscriptions, referrals, refund_requests, subscriptions, user_roles, workout_feedback, workout_logs ✅
- Functions: get_admin_metrics (com MRR/LTV/churn), has_role, handle_new_user, generate_referral_code, get_monthly_ranking, notify_new_journal_article, prevent_self_admin_promotion ✅
- Edge functions: analyze-body, chat, fetch-journal, generate-protocol, journal-notify, push-send, push-subscribe, swap-exercise ✅
- Storage: photos, avatars, exercise-videos ✅
- Secrets: LOVABLE_API_KEY, VAPID_PRIVATE_KEY ✅

Build errors: TS errors em push-send/index.ts e journal-notify/index.ts (Uint8Array→ArrayBuffer cast). Precisa fix.

Faltando para Pacote C estar 100%:
1. Seed inicial em `plans` (tabela vazia → MRR=0). Sem isso, métricas não calculam nada.
2. Build errors nos edge functions (bloqueia deploy).

Vou apresentar plano enxuto: corrigir build + seed plans.

# Diagnóstico do backend

## O que JÁ está pronto ✅

**Tabelas (21):** todas do Pacote C criadas — `plans`, `coupons`, `coupon_redemptions`, `refund_requests`, `live_meetings`, `admin_audit_log`, etc. RLS configurada em todas.

**Funções SQL:** `get_admin_metrics()` já calcula MRR, LTV, churn 30d, conversão, retenção 7d/30d, signups diários. `has_role`, `handle_new_user`, `prevent_self_admin_promotion` ativas.

**Edge functions (8):** chat, generate-protocol, analyze-body, fetch-journal, journal-notify, push-send, push-subscribe, swap-exercise.

**Storage:** buckets `photos`, `avatars`, `exercise-videos`.

**Secrets:** `LOVABLE_API_KEY`, `VAPID_PRIVATE_KEY` configurados.

## O que falta ⚠️

**1. Build errors em 2 edge functions** (bloqueia deploy)
- `push-send/index.ts` e `journal-notify/index.ts` têm 8 erros TS2345 sobre `Uint8Array → ArrayBuffer`. Causa: tipo estrito do Deno mais novo. Fix: castar `.buffer as ArrayBuffer` ou usar `new Uint8Array(arr).buffer.slice(0)`.

**2. Tabela `plans` está vazia**
- Sem registros, o `get_admin_metrics()` retorna **MRR = 0** e **LTV = 0**. Você precisa inserir os 3 planos padrão (Mensal/Trimestral/Anual) ou criar via aba `AdminPlans` no painel.

**3. (Opcional) Trigger de `updated_at`**
- As tabelas novas (`plans`, `coupons`, `refund_requests`) têm coluna `updated_at` mas sem trigger automático. Hoje funciona porque o frontend não atualiza esse campo manualmente — mas se quiser auditoria correta, vale adicionar.

## Plano de ação

### Etapa 1 — Corrigir build errors (obrigatório)
Em `push-send/index.ts` e `journal-notify/index.ts`, ajustar 4 chamadas em cada arquivo:
```ts
// antes
base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)))
// depois
base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)).buffer as ArrayBuffer)
```
Mesmo padrão para `rawSig.buffer` e `vapidPublicKeyBytes.buffer`.

### Etapa 2 — Seed da tabela `plans`
Inserir via insert tool:
| code | name | price_brl | interval_months |
|---|---|---|---|
| monthly | Mensal | 97.00 | 1 |
| quarterly | Trimestral | 249.00 | 3 |
| yearly | Anual | 897.00 | 12 |

Após isso, `MRR`, `LTV` e gráficos no Overview do `/admin` ficam funcionais.

### Etapa 3 (opcional) — Triggers updated_at
Migration adicionando trigger `update_updated_at_column` nas 3 tabelas novas. Pode pular se quiser.

## Resposta direta

**Backend está 95% pronto.** Falta só (a) corrigir 8 erros TS nos edge functions de push e (b) popular a tabela `plans` com os 3 valores padrão pra MRR/LTV calcularem corretamente. Sem isso o painel funciona, mas mostra zeros nas métricas financeiras.

