

User wants to clear their TOTP factor so they can re-enroll. This requires a DELETE on `auth.mfa_factors` for the admin user. Need to find the admin's user_id first.

The admin email is `adminkevinfranzen@hypertrophy.app`. I'll write a migration that deletes all MFA factors for that user.

Note: modifying `auth` schema is normally discouraged, but `auth.mfa_factors` deletion for account recovery is a standard, supported operation (Supabase docs explicitly allow it). It does not change auth schema structure — just removes a row.

# Plano — Resetar MFA TOTP do admin

## O que vai acontecer

Vou rodar um comando SQL que remove todos os fatores TOTP cadastrados para a conta `adminkevinfranzen@hypertrophy.app`. Isso faz com que, no próximo login em `/admin`, o `AdminGate` detecte que não há fator verificado e mostre a tela de **enrollment** (QR Code novo) em vez da tela de challenge.

## SQL que será executado

```sql
DELETE FROM auth.mfa_factors
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'adminkevinfranzen@hypertrophy.app'
);
```

Também vou rodar um `SELECT` antes para confirmar quantos fatores existem (TOTP, recovery, etc.) e te mostrar o resultado.

## Após a execução

1. Faça **logout** se estiver logado (a sessão atual pode ainda estar marcada como aal2 em cache).
2. Acesse `/login` → entre com email + senha.
3. Vá em `/admin` → vai aparecer a tela **AdminMFAEnroll** com QR Code novo.
4. Escaneie no Google Authenticator / Authy / 1Password.
5. Digite os 6 dígitos para confirmar → painel liberado.

## Considerações de segurança

- Apenas a sua conta de admin é afetada — nenhum outro usuário.
- A senha **não muda** — só o segundo fator é resetado.
- Operação será registrada na migration (rastreável no histórico).
- Como está sendo feita via migration administrativa (não pelo painel), não passa pelo `admin_audit_log` — se quiser, posso adicionar um INSERT manual no log para registrar a recuperação.

