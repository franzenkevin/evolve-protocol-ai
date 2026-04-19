import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Calendar, Activity } from "lucide-react";

interface Profile {
  cardio_enabled?: boolean | null;
  cardio_type_preference?: string | null;
  cardio_timing?: string | null;
  cardio_duration?: string | null;
  cardio_frequency?: string | null;
}

interface CardioCardProps {
  profile: Profile | null | undefined;
  /** "rest" → mostrar com mais destaque (dia de descanso ativo); "training" → mostrar como complemento ao treino */
  variant?: "rest" | "training";
}

const TIMING_LABELS: Record<string, string> = {
  before: "Antes do treino",
  after: "Depois do treino",
  morning: "Pela manhã",
  evening: "À noite",
  separate: "Em horário separado",
};

const TYPE_LABELS: Record<string, string> = {
  liss: "LISS — caminhada / esteira em ritmo leve",
  hiit: "HIIT — alta intensidade intervalado",
  bike: "Bike ergométrica",
  treadmill: "Esteira",
  outdoor: "Corrida ao ar livre",
  elliptical: "Elíptico",
  stairs: "Escada / Stairmaster",
  swim: "Natação",
};

const CardioCard = ({ profile, variant = "training" }: CardioCardProps) => {
  if (!profile?.cardio_enabled) return null;

  const type = profile.cardio_type_preference?.toLowerCase().trim() || "";
  const typeLabel =
    TYPE_LABELS[type] ||
    (profile.cardio_type_preference ? profile.cardio_type_preference : "Cardio");

  const timing = profile.cardio_timing?.toLowerCase().trim() || "";
  const timingLabel = TIMING_LABELS[timing] || profile.cardio_timing || "";

  const isRest = variant === "rest";

  return (
    <Card
      className={`p-4 ${
        isRest
          ? "bg-gradient-to-br from-orange-500/15 to-rose-500/10 border-orange-500/40"
          : "card-gradient border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isRest ? "bg-orange-500/25" : "bg-primary/15"
          }`}
        >
          <Heart size={18} className={isRest ? "text-orange-400" : "text-primary"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-foreground text-sm">
              {isRest ? "Hoje é dia de cardio" : "Cardio do dia"}
            </h3>
            {timingLabel && !isRest && (
              <Badge variant="outline" className="text-[10px] py-0 h-4">
                {timingLabel}
              </Badge>
            )}
          </div>

          <p className="text-sm text-foreground mt-1">{typeLabel}</p>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.cardio_duration && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5 gap-1">
                <Clock size={10} />
                {profile.cardio_duration}
              </Badge>
            )}
            {profile.cardio_frequency && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5 gap-1">
                <Calendar size={10} />
                {profile.cardio_frequency}
              </Badge>
            )}
            {isRest && timingLabel && (
              <Badge variant="secondary" className="text-[10px] py-0 h-5">
                {timingLabel}
              </Badge>
            )}
          </div>

          {isRest && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Mesmo sendo dia de descanso da musculação, hoje você tem cardio no protocolo. Mantenha o ritmo definido — sem exagerar para não comprometer a recuperação.
            </p>
          )}

          {!isRest && timing === "before" && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Activity size={10} /> Faça <strong>antes</strong> do treino de hoje.
            </p>
          )}
          {!isRest && timing === "after" && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Activity size={10} /> Faça <strong>depois</strong> do treino de hoje.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CardioCard;
