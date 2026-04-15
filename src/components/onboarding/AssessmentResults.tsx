import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Star } from "lucide-react";

interface Assessment {
  body_fat_estimate?: string;
  body_fat_category?: string;
  posture_deviations?: string[];
  strong_points?: string[];
  weak_points?: string[];
  muscle_development?: {
    upper_body?: string;
    core?: string;
    lower_body?: string;
  };
  recommendations?: string[];
  overall_summary?: string;
  raw?: boolean;
}

interface AssessmentResultsProps {
  assessment: Assessment | null;
  loading: boolean;
}

export const AssessmentResults = ({ assessment, loading }: AssessmentResultsProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Analisando suas fotos com IA...</p>
        <p className="text-xs text-muted-foreground">Isso pode levar até 30 segundos</p>
      </div>
    );
  }

  if (!assessment) return null;

  if (assessment.raw) {
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-foreground">{assessment.overall_summary}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-heading font-bold text-foreground">Resultado da Avaliação</h3>

      {/* Body Fat */}
      {assessment.body_fat_estimate && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Gordura corporal estimada</p>
          <p className="text-2xl font-bold text-primary">{assessment.body_fat_estimate}</p>
          {assessment.body_fat_category && (
            <p className="text-sm text-foreground">{assessment.body_fat_category}</p>
          )}
        </div>
      )}

      {/* Muscle Development */}
      {assessment.muscle_development && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Desenvolvimento Muscular</p>
          {Object.entries(assessment.muscle_development).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground capitalize">
                {key === "upper_body" ? "Superior" : key === "core" ? "Core" : "Inferior"}
              </span>
              <span className="text-xs text-foreground">{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Strong Points */}
      {assessment.strong_points && assessment.strong_points.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <Star className="w-3 h-3 text-primary" /> Pontos Fortes
          </p>
          {assessment.strong_points.map((p, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-4">• {p}</p>
          ))}
        </div>
      )}

      {/* Weak Points */}
      {assessment.weak_points && assessment.weak_points.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-orange-400" /> Áreas para Melhorar
          </p>
          {assessment.weak_points.map((p, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-4">• {p}</p>
          ))}
        </div>
      )}

      {/* Posture */}
      {assessment.posture_deviations && assessment.posture_deviations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-400" /> Desvios Posturais
          </p>
          {assessment.posture_deviations.map((d, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-4">• {d}</p>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" /> Recomendações
          </p>
          {assessment.recommendations.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-4">• {r}</p>
          ))}
        </div>
      )}

      {/* Summary */}
      {assessment.overall_summary && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-foreground mb-1">Resumo</p>
          <p className="text-xs text-muted-foreground">{assessment.overall_summary}</p>
        </div>
      )}
    </div>
  );
};
