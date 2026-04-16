

User approved Package B. Need concise plan covering 3 items: MFA TOTP for admins, audit log table, replace confirm() with AlertDialog.

Let me check what's already in place for AdminUsers (uses confirm) and find other confirm() usages.

Key considerations:
- MFA TOTP: Supabase supports `auth.mfa.enroll/challenge/verify`. Need enrollment UI + gate in AdminGate that blocks admins without verified MFA factor.
- Audit log: new table `admin_audit_log` with admin-only RLS, log on lead export + promote/demote.
- AlertDialog already exists in ui/. Replace `confirm()` calls in admin panel.

Plan:

# Pacote B — Hardening Admin

## 1. MFA TOTP obrigatório para admins

**Banco de dados:** nada novo (Supabase Auth já tem suporte nativo a TOTP via `auth.mfa.*`).

**Novo componente `AdminMFAEnroll.tsx`:**
- Detecta admin sem fator TOTP verificado (`supabase.auth.mfa.listFactors()`)
- Mostra QR Code (`enroll({ factorType: 'totp' })`) + campo de 6 dígitos
- Verifica com `challenge()` + `verify()` antes de liberar acesso

**Atualizar `AdminGate.tsx`:**
- Após confirmar `isAdmin`, checa `aal` (Authenticator Assurance Level) via `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`
- Se admin e `currentLevel !== 'aal2'` → renderiza `AdminMFAEnroll` (enrollment) ou `AdminMFAChallenge` (login)
- Só libera children quando `aal2` confirmado

**Fluxo:**
```text
Login → isAdmin? → tem TOTP factor verificado?
  ├─ Não → AdminMFAEnroll (escaneia QR no Google Auth/Authy)
  └─ Sim, mas aal=aal1 → AdminMFAChallenge (digita código)
        └─ aal2 → libera /admin
```

## 2. Tabela `admin_audit_log`

**Migration:**
```sql
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,         -- 'export_leads', 'promote_admin', 'demote_admin', 'export_sales'
  target_user_id uuid,          -- alvo da ação (se aplicável)
  metadata jsonb DEFAULT '{}',  -- contagem de linhas exportadas, etc
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

CREATE INDEX idx_audit_log_created ON public.admin_audit_log (created_at DESC);
```

**Hook `useAuditLog.ts`:** função `logAction(action, target?, metadata?)` que insere registro.

**Pontos de logging:**
- `AdminLeads.tsx` export CSV → `log('export_leads', null, { count })`
- `AdminUsers.tsx` promote → `log('promote_admin', userId)`
- (futuro) demote → `log('demote_admin', userId)`
- `AdminSales.tsx` export CSV (se existir) → `log('export_sales', null, { count })`

**Nova aba "Auditoria"** em `Admin.tsx`: lista cronológica de ações com admin (lookup pelo profile), ação, alvo e timestamp.

## 3. Substituir `confirm()` nativo por AlertDialog

Encontrado em `AdminUsers.tsx` (promover). Vou auditar com search e substituir todas as ocorrências em `src/components/admin/**` por `AlertDialog` controlado por estado (padrão shadcn já presente em `ui/alert-dialog.tsx`).

**Padrão:**
```tsx
const [confirming, setConfirming] = useState<{userId, name} | null>(null);
// botão abre setConfirming(...)
<AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Promover {confirming?.name} a admin?</AlertDialogTitle>
      <AlertDialogDescription>Esta ação será registrada no log de auditoria...</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={confirmPromote}>Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Arquivos a criar/editar

```text
NOVO  supabase/migrations/<ts>_admin_audit_log.sql
NOVO  src/components/admin/AdminMFAEnroll.tsx
NOVO  src/components/admin/AdminMFAChallenge.tsx
NOVO  src/components/admin/AdminAuditLog.tsx
NOVO  src/hooks/useAuditLog.ts
EDIT  src/components/AdminGate.tsx       (adiciona MFA gate)
EDIT  src/components/admin/AdminUsers.tsx (AlertDialog + log)
EDIT  src/components/admin/AdminLeads.tsx (log no export)
EDIT  src/pages/Admin.tsx                (nova aba Auditoria)
```

## Considerações

- **Você (admin atual)** vai precisar enrolar TOTP no próximo login. Use Google Authenticator, Authy ou 1Password.
- **Se perder o segredo TOTP**, posso deixar instruções de recovery via SQL (limpar fator pelo admin do banco).
- Audit log é append-only (sem DELETE/UPDATE policies) para integridade.

## Detalhes técnicos

- `supabase.auth.mfa.enroll({ factorType: 'totp' })` retorna `{ id, totp: { qr_code, secret, uri } }`. Renderizar `qr_code` (já é SVG/data-URL).
- `getAuthenticatorAssuranceLevel()` → `{ currentLevel, nextLevel }`. Admin precisa `currentLevel === 'aal2'`.
- `mfa.challenge({ factorId })` → `{ id }`; depois `mfa.verify({ factorId, challengeId, code })`.
- Audit log insert ocorre **após** sucesso da ação (não bloqueia em caso de falha de log).

