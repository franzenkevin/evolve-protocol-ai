import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Row {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  checkins_count: number;
  workouts_count: number;
  total_score: number;
}

const AdminRanking = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_monthly_ranking" as any);
      if (error) throw error;
      return (data || []) as Row[];
    },
    staleTime: 30_000,
  });

  const badge = (r: number) => {
    if (r === 1) return <Trophy size={14} className="text-warning" />;
    if (r === 2) return <Medal size={14} className="text-muted-foreground" />;
    if (r === 3) return <Award size={14} className="text-warning/70" />;
    return <span className="text-xs font-bold text-muted-foreground tabular-nums">{r}º</span>;
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Trophy size={16} className="text-warning" /> Log de ranking — mês atual
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Pontuação: 1pt/treino • 1pt/dia dieta • 3pts/check semanal • 10pts/check mensal+60d • 10pts a cada 7 dias seguidos de treino+dieta
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem pontuação ainda este mês.</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => {
            const initials = r.nickname.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={r.user_id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
                <div className="w-8 flex items-center justify-center shrink-0">{badge(r.rank)}</div>
                <Avatar className="w-8 h-8 shrink-0">
                  {r.avatar_url && <AvatarImage src={r.avatar_url} />}
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.nickname}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.workouts_count} treinos • {r.checkins_count} check-ins
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-primary tabular-nums">{r.total_score}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AdminRanking;
