import { useState, useMemo } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMobility } from "@/hooks/useMobility";
import ExerciseVideo from "@/components/ExerciseVideo";
import { Activity, Clock, Repeat, Play, X } from "lucide-react";

interface MobilityDrawerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Pre-select region based on the muscle group of the day, e.g. "Pernas" → "quadril" */
  suggestedRegion?: string;
}

const REGION_LABELS: Record<string, string> = {
  quadril: "Quadril",
  coluna_toracica: "Coluna torácica",
  ombros: "Ombros",
  tornozelo: "Tornozelo",
  punho: "Punho",
  joelho: "Joelho",
  cervical: "Cervical",
  global: "Aquecimento geral",
};

/** Map muscle group label → suggested mobility region(s) */
function regionsForMuscleGroup(group: string | undefined): string[] {
  if (!group) return ["global"];
  const g = group.toLowerCase();
  if (g.includes("perna") || g.includes("inferior") || g.includes("legs") || g.includes("glúteo") || g.includes("gluteo"))
    return ["quadril", "tornozelo", "joelho", "global"];
  if (g.includes("peito") || g.includes("push") || g.includes("ombro"))
    return ["ombros", "coluna_toracica", "global"];
  if (g.includes("costas") || g.includes("pull"))
    return ["coluna_toracica", "ombros", "global"];
  if (g.includes("upper") || g.includes("superior") || g.includes("full"))
    return ["ombros", "coluna_toracica", "quadril", "global"];
  return ["global"];
}

const MobilityDrawer = ({ open, onOpenChange, suggestedRegion }: MobilityDrawerProps) => {
  const { data: items = [], isLoading } = useMobility();
  const suggested = useMemo(() => regionsForMuscleGroup(suggestedRegion), [suggestedRegion]);
  const [region, setRegion] = useState<string>("suggested");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (region === "all") return items;
    if (region === "suggested") return items.filter((m) => suggested.includes(m.region));
    return items.filter((m) => m.region === region);
  }, [items, region, suggested]);

  // Group by region for display
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const m of filtered) {
      if (!map.has(m.region)) map.set(m.region, []);
      map.get(m.region)!.push(m);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Rotina de mobilidade
          </DrawerTitle>
          <DrawerDescription>
            Faça antes do treino para preparar as articulações e prevenir lesões.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          <div className="mb-3">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggested">
                  Sugeridas para hoje{suggestedRegion ? ` (${suggestedRegion})` : ""}
                </SelectItem>
                <SelectItem value="all">Todas regiões</SelectItem>
                {Object.entries(REGION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma mobilidade encontrada para esta seleção.
            </p>
          )}

          <div className="space-y-4">
            {grouped.map(([reg, list]) => (
              <div key={reg} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {REGION_LABELS[reg] || reg.replace("_", " ")}
                </h4>
                {list.map((m) => {
                  const isPlaying = playingId === m.id;
                  return (
                    <Card key={m.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{m.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-[10px] py-0 h-4">
                              {m.type}
                            </Badge>
                            {m.duration_seconds && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 gap-0.5">
                                <Clock size={9} /> {m.duration_seconds}s
                              </Badge>
                            )}
                            {m.reps && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 gap-0.5">
                                <Repeat size={9} /> {m.reps}
                              </Badge>
                            )}
                            {m.side === "unilateral" && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                cada lado
                              </Badge>
                            )}
                            {m.equipment && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {m.equipment}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {m.instructions && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {m.instructions}
                        </p>
                      )}

                      {!isPlaying ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 gap-1.5 text-xs"
                          onClick={() => setPlayingId(m.id)}
                        >
                          <Play size={12} /> Ver vídeo de execução
                        </Button>
                      ) : (
                        <div className="space-y-1">
                          <ExerciseVideo
                            exerciseName={m.name}
                            videoUrl={m.video_url}
                            videoQuery={`${m.name} mobilidade execução`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs w-full"
                            onClick={() => setPlayingId(null)}
                          >
                            <X size={12} /> Fechar vídeo
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobilityDrawer;
