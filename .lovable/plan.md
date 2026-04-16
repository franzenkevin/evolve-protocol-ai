

The user wants a creator/admin dashboard with hardcoded credentials. This is a security concern I need to address — hardcoded credentials in code are a major vulnerability. But the underlying need (single admin login, full data access for sales/leads/renewals/marketing) is legitimate.

Best approach: use the existing `user_roles` admin role + Supabase Auth (email/password), seed ONE admin account with those exact credentials via SQL. The credentials live encrypted in `auth.users` (bcrypt), NOT in code. Same login form as users, but role gates the panel.

Plan must cover: secure setup, admin gate, panel tabs (sales, leads, renewals, content/videos, users, metrics).

Keep concise.

