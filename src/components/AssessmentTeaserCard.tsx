import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, TrendingUp, AlertTriangle, Star, Eye } from "lucide-react";
import { useBodyAssessments } from "@/hooks/useBodyAssessments";

/**
 * Teaser shown on /plans for users who finished the quiz + body assessment
 * but haven't paid yet. Combines:
 *  - Counts (X strong points, Y weak points, Z recommendations)
 *  - 2 visible insights (1 strong + 1 weak)
 *  - Blurred locked content with CTA
 */
export default function AssessmentTeaserCard() {
  const { data: assessments = [], isLoading } = useBodyAssessments();
  const last = assessments[0];

  if (isLoading || !last) return null;

  const strongCount = (last.strong_points || []).length;
  const weakCount = (last.weak_points || []).length;
  const recCount = (last.recommendations || []).length;
  const postureCount = (last.posture_deviations || []).length;

  const firstStrong = last.strong_points?.[0];
  const firstWeak = last.weak_points?.[0];
  const hiddenStrong = Math.max(0, strongCount - 1);
  const hiddenWeak = Math.max(0, weakCount - 1);

  return (
    <Card className="p-4 card-gradient border-primary/40 relative overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles size={16} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-heading font-bold text-foreground">
            Sua avaliação corporal está pronta
          </p>
          <p className="text-[11px] text-muted-foreground">
            Análise feita pela IA com base nas suas fotos
          </p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
          IA
        </Badge>
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-center">
          <p className="text-lg font-bold text-primary leading-none">{strongCount}</p>
          <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">
            Pontos fortes
          </p>
        </div>
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-2 text-center">
          <p className="text-lg font-bold text-warning leading-none">{weakCount}</p>
          <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">
            A corrigir
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-2 text-center">
          <p className="text-lg font-bold text-foreground leading-none">
            {recCount + postureCount}
          </p>
          <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">
            Recomendações
          </p>
        </div>
      </div>

      {/* Body fat preview (visible) */}
      {last.body_fat_estimate && (
        <div className="rounded-lg border border-border bg-card/50 p-2.5 mb-3 flex items-center gap-2">
          <Eye size={14} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase">Gordura corporal estimada</p>
            <p className="text-sm font-semibold text-foreground">
              {last.body_fat_estimate}{" "}
              {last.body_fat_category && (
                <span className="text-muted-foreground font-normal">· {last.body_fat_category}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 2 visible insights */}
      <div className="space-y-1.5 mb-3">
        {firstStrong && (
          <div className="flex items-start gap-2 text-xs">
            <Star size={12} className="text-primary mt-0.5 shrink-0" />
            <p className="text-foreground line-clamp-2">{firstStrong}</p>
          </div>
        )}
        {firstWeak && (
          <div className="flex items-start gap-2 text-xs">
            <AlertTriangle size={12} className="text-warning mt-0.5 shrink-0" />
            <p className="text-foreground line-clamp-2">{firstWeak}</p>
          </div>
        )}
      </div>

      {/* Blurred locked section */}
      <div className="relative rounded-lg border border-dashed border-primary/30 bg-card/30 p-3">
        <div className="space-y-1.5 select-none pointer-events-none" style={{ filter: "blur(5px)" }}>
          <div className="flex items-start gap-2 text-xs">
            <TrendingUp size={12} className="text-primary mt-0.5 shrink-0" />
            <p className="text-foreground">
              {hiddenStrong > 0
                ? `+${hiddenStrong} pontos fortes detectados na sua composição corporal`
                : "Análise detalhada de simetria e proporção muscular"}
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <AlertTriangle size={12} className="text-warning mt-0.5 shrink-0" />
            <p className="text-foreground">
              {hiddenWeak > 0
                ? `+${hiddenWeak} áreas que precisam de atenção prioritária`
                : "Mapeamento completo dos grupos musculares atrasados"}
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Sparkles size={12} className="text-primary mt-0.5 shrink-0" />
            <p className="text-foreground">
              Plano personalizado de treino + dieta calculado pela IA
            </p>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Star size={12} className="text-primary mt-0.5 shrink-0" />
            <p className="text-foreground">
              Estratégia para corrigir desvios posturais e proporção
            </p>
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-t from-card/95 via-card/70 to-transparent rounded-lg">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock size={16} className="text-primary" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            Desbloqueie sua análise completa
          </p>
          <p className="text-[10px] text-muted-foreground text-center px-4">
            Assine abaixo e receba o protocolo completo em segundos
          </p>
        </div>
      </div>
    </Card>
  );
}
