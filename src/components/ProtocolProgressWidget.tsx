import { Card } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Calendar, Dumbbell, Weight, TrendingUp } from "lucide-react";

interface ProtocolProgressWidgetProps {
  startDate: string;
  endDate: string;
  totalWorkouts: number;
  totalTonnage: number;
  avgAdherence: number;
}

const ProtocolProgressWidget = ({
  startDate,
  endDate,
  totalWorkouts,
  totalTonnage,
  avgAdherence,
}: ProtocolProgressWidgetProps) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalDays = Math.max(1, Math.ceil((end - start) / 86400000));
  const dayNumber = Math.min(totalDays, Math.max(1, Math.ceil((now - start) / 86400000)));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  const pct = Math.min(100, Math.max(0, Math.round((dayNumber / totalDays) * 100)));

  const fmtTonnage = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${Math.round(kg)}kg`;
  };

  return (
    <Card className="p-4 card-gradient border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Calendar size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm">Sua jornada</h3>
            <p className="text-[10px] text-muted-foreground">
              Dia {dayNumber} de {totalDays} • {daysLeft} restantes
            </p>
          </div>
        </div>
        <span className="text-lg font-bold text-primary tabular-nums">{pct}%</span>
      </div>

      <ProgressBar value={pct} className="h-2 mb-3" />

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary/50 rounded-md p-2">
          <Dumbbell size={12} className="mx-auto text-primary mb-0.5" />
          <p className="text-sm font-bold text-foreground tabular-nums">{totalWorkouts}</p>
          <p className="text-[9px] text-muted-foreground leading-tight">Treinos feitos</p>
        </div>
        <div className="bg-secondary/50 rounded-md p-2">
          <Weight size={12} className="mx-auto text-info mb-0.5" />
          <p className="text-sm font-bold text-foreground tabular-nums">{fmtTonnage(totalTonnage)}</p>
          <p className="text-[9px] text-muted-foreground leading-tight">Volume total</p>
        </div>
        <div className="bg-secondary/50 rounded-md p-2">
          <TrendingUp size={12} className="mx-auto text-success mb-0.5" />
          <p className="text-sm font-bold text-foreground tabular-nums">{avgAdherence}%</p>
          <p className="text-[9px] text-muted-foreground leading-tight">Aderência</p>
        </div>
      </div>
    </Card>
  );
};

export default ProtocolProgressWidget;
