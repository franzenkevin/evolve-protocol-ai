import { useMonthlyRanking, RankingEntry } from "@/hooks/useRanking";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Flame } from "lucide-react";

const monthLabel = () => {
  const d = new Date();
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const rankBadge = (rank: number) => {
  if (rank === 1) return <Trophy size={14} className="text-warning" />;
  if (rank === 2) return <Medal size={14} className="text-muted-foreground" />;
  if (rank === 3) return <Award size={14} className="text-warning/70" />;
  return <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{rank}º</span>;
};

const RankingRow = ({ entry }: { entry: RankingEntry }) => {
  const initials = entry.nickname
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-md ${
        entry.is_current_user
          ? "bg-primary/15 border border-primary/30"
          : "bg-secondary/30"
      }`}
    >
      <div className="w-6 flex items-center justify-center shrink-0">{rankBadge(entry.rank)}</div>
      <Avatar className="w-7 h-7 shrink-0">
        {entry.avatar_url && <AvatarImage src={entry.avatar_url} alt={entry.nickname} />}
        <AvatarFallback className="text-[9px] bg-primary/15 text-primary font-bold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${entry.is_current_user ? "text-primary" : "text-foreground"}`}>
          {entry.nickname} {entry.is_current_user && <span className="text-[9px] opacity-70">(você)</span>}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {entry.workouts_count} treinos • {entry.checkins_count} check-ins
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary tabular-nums">{entry.total_score}</p>
        <p className="text-[9px] text-muted-foreground">pts</p>
      </div>
    </div>
  );
};

const SectionRanking = () => {
  const { data: ranking = [], isLoading } = useMonthlyRanking();
  const me = ranking.find((r) => r.is_current_user);
  const top = ranking.slice(0, 10);
  const showMeOutsideTop = me && me.rank > 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ranking de alunos</h3>
        <span className="text-[10px] text-muted-foreground capitalize">{monthLabel()}</span>
      </div>

      <Card className="p-3 card-gradient border-border">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={14} className="text-warning" />
          <p className="text-[10px] text-muted-foreground leading-tight">
            +1 ponto por check-in,<br />
            +2 por treino registrado.<br />
            Top 3 ganha medalha 🏆
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-md bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Seja o primeiro a pontuar este mês!
          </p>
        ) : (
          <div className="space-y-1.5">
            {top.map((entry) => (
              <RankingRow key={entry.user_id} entry={entry} />
            ))}
            {showMeOutsideTop && (
              <>
                <div className="text-center text-[10px] text-muted-foreground py-0.5">···</div>
                <RankingRow entry={me!} />
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SectionRanking;
