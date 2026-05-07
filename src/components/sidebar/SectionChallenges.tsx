import { useActiveChallenges } from "@/hooks/useChallenges";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Trophy } from "lucide-react";

const SectionChallenges = () => {
  const { data: challenges = [], isLoading } = useActiveChallenges();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Desafio do mês
        </h3>
        <Target size={12} className="text-primary" />
      </div>

      <Card className="p-3 card-gradient border-border">
        {isLoading ? (
          <div className="h-12 rounded-md bg-secondary/30 animate-pulse" />
        ) : challenges.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum desafio ativo no momento. Em breve!
          </p>
        ) : (
          <div className="space-y-2">
            {challenges.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-tight">{c.title}</p>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Trophy size={10} className="text-warning" />
                    +{c.reward_points} pts
                  </Badge>
                </div>
                {c.description && (
                  <p className="text-[11px] text-muted-foreground leading-snug whitespace-pre-line">
                    {c.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SectionChallenges;
