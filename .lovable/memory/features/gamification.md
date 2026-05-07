---
name: Gamification & Ranking
description: Sistema de pontuação mensal, regras de pontos e desafios admin-editáveis
type: feature
---
**Pontuação mensal (RPC `get_monthly_ranking`)**:
- 1 pt por treino registrado (workout_logs, distinct session_date)
- 1 pt por dia de feedback de dieta (diet_feedback, distinct rated_date)
- 10 pts a cada 7 dias seguidos com treino+dieta no mesmo dia (streak / 7 * 10)
- 3 pts por check-in semanal (checkins)
- 10 pts pelo check-in mensal (~dia 30) e 10 pts pelo check-in dos 60 dias (protocol_milestone_feedbacks: milestone_day 28-32 → 10, ≥60 → 10)

**Tabela `monthly_challenges`**: title, description, reward_points, month_start, active, created_by. RLS: admin all; authenticated select se active=true. Admin edita via aba "Desafios".

**UI**:
- `SectionChallenges` no sidebar (acima do Ranking) mostra desafios ativos
- Admin tabs novas: "Desafios" (`AdminChallenges`) e "Ranking" (`AdminRanking` — log completo do mês)
- `useChallenges.ts`: hooks active/all/mutations
