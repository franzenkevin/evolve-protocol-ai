import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronDown, ChevronUp, Utensils } from "lucide-react";
import { useTodayDietFeedback, useUpsertDietFeedback } from "@/hooks/useDietFeedback";
import { toast } from "sonner";

const Stars = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded-md border text-sm font-semibold transition-colors ${
            value >= n
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/30 text-muted-foreground border-border"
          }`}
          aria-label={`${label} ${n}`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const DietFeedbackCard = () => {
  const { data: existing } = useTodayDietFeedback();
  const upsert = useUpsertDietFeedback();
  const [expanded, setExpanded] = useState(false);

  const [adherence, setAdherence] = useState(100);
  const [hunger, setHunger] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [digestion, setDigestion] = useState(3);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existing) {
      setAdherence(existing.adherence ?? 100);
      setHunger(existing.hunger_level ?? 3);
      setEnergy(existing.energy_level ?? 3);
      setDigestion(existing.digestion ?? 3);
      setNotes(existing.notes ?? "");
    }
  }, [existing]);

  const handleSubmit = async () => {
    try {
      await upsert.mutateAsync({
        adherence,
        hunger_level: hunger,
        energy_level: energy,
        digestion,
        notes: notes.trim() || null,
      });
      toast.success("Feedback registrado!");
      setExpanded(false);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
    }
  };

  const isDone = !!existing;

  return (
    <Card className="overflow-hidden border-border">
      <button
        className="w-full p-4 flex items-center justify-between text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isDone ? "bg-primary/15" : "bg-muted"}`}>
            {isDone ? (
              <CheckCircle2 size={18} className="text-primary" />
            ) : (
              <Utensils size={18} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm text-foreground">
              Feedback diário da dieta
            </h3>
            <p className="text-xs text-muted-foreground">
              {isDone ? "Atualize seu registro de hoje" : "Como foi sua dieta hoje? (opcional)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDone && (
            <Badge variant="secondary" className="text-[10px]">
              {existing!.adherence}%
            </Badge>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">Aderência ao plano</p>
              <span className="text-sm font-bold text-primary">{adherence}%</span>
            </div>
            <Slider
              value={[adherence]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => setAdherence(v[0])}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Stars value={hunger} onChange={setHunger} label="Fome durante o dia (1=baixa, 5=alta)" />
            <Stars value={energy} onChange={setEnergy} label="Energia / disposição (1=baixa, 5=alta)" />
            <Stars value={digestion} onChange={setDigestion} label="Digestão (1=ruim, 5=ótima)" />
          </div>

          <Textarea
            placeholder="Observações (ex: senti fome à tarde, bati todas as refeições...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="text-sm"
          />

          <Button
            onClick={handleSubmit}
            disabled={upsert.isPending}
            className="w-full"
          >
            {upsert.isPending ? "Salvando..." : isDone ? "Atualizar feedback" : "Salvar feedback"}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default DietFeedbackCard;
