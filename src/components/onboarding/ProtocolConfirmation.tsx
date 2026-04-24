import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Sparkles, Activity, Utensils, Target } from "lucide-react";
import { SPLITS_MEN, SPLITS_WOMEN } from "@/lib/workoutRules";

export type ConfirmationAnswer = {
  agree: "yes" | "no" | "";
  justification: string;
};

export type SplitConfirmation = ConfirmationAnswer & {
  /** Nome da variante de split escolhida pelo aluno (override do default). */
  chosenVariant?: string;
};

export type ProtocolConfirmations = {
  bodyEmphasis: { wants: "yes" | "no" | ""; description: string };
  split: SplitConfirmation;
  cardio: ConfirmationAnswer;
  mealTimes: ConfirmationAnswer;
};

interface Props {
  sex: "M" | "F" | string;
  trainingDays: number;
  cardioEnabled: boolean;
  cardioFrequency?: string;
  cardioType?: string;
  cardioDuration?: string;
  mealCount: number;
  trainingTime?: string;
  weakPoints?: string[];
  initial?: ProtocolConfirmations;
  onChange: (v: ProtocolConfirmations) => void;
}

const DEFAULT_VALUE: ProtocolConfirmations = {
  bodyEmphasis: { wants: "", description: "" },
  split: { agree: "", justification: "", chosenVariant: undefined },
  cardio: { agree: "", justification: "" },
  mealTimes: { agree: "", justification: "" },
};

function getSplitVariants(sex: string, days: number) {
  const table = sex === "F" ? SPLITS_WOMEN : SPLITS_MEN;
  return table[days] || table[4] || table[3] || [];
}

function getDefaultSplit(sex: string, days: number) {
  const variants = getSplitVariants(sex, days);
  return variants.find((v) => v.defaultChoice) || variants[0];
}

function suggestMealTimes(count: number, trainingTime?: string): string {
  if (count === 3) return "07:00 — 12:00 — 20:00";
  if (count === 4) return "07:00 — 12:00 — 16:00 — 20:00";
  if (count === 5) return "07:00 — 10:00 — 12:00 — 16:00 — 20:00";
  return "07:00 — 10:00 — 12:00 — 15:30 — 17:30 — 20:00";
}

export const ProtocolConfirmation = ({
  sex,
  trainingDays,
  cardioEnabled,
  cardioFrequency,
  cardioType,
  cardioDuration,
  mealCount,
  trainingTime,
  weakPoints,
  initial,
  onChange,
}: Props) => {
  const [v, setV] = useState<ProtocolConfirmations>(initial || DEFAULT_VALUE);

  const split = useMemo(() => getDefaultSplit(sex, trainingDays), [sex, trainingDays]);
  const mealTimes = useMemo(() => suggestMealTimes(mealCount, trainingTime), [mealCount, trainingTime]);

  const update = (patch: Partial<ProtocolConfirmations>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-heading font-bold text-foreground">Confirmação do Protocolo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Antes de gerar seu protocolo, confirme os pontos abaixo. Se não concordar, descreva brevemente o que prefere.
        </p>
      </div>

      {/* 0) Ênfase corporal */}
      <Card className="p-4 card-gradient border-primary/30 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Ênfase corporal</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Você quer dar alguma ênfase específica no seu corpo neste protocolo?
          {weakPoints && weakPoints.length > 0 && (
            <> A IA já planeja priorizar: <span className="text-foreground">{weakPoints.join(", ")}</span>.</>
          )}
        </p>
        <RadioGroup
          value={v.bodyEmphasis.wants}
          onValueChange={(val) => update({ bodyEmphasis: { ...v.bodyEmphasis, wants: val as "yes" | "no" } })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="emp-yes" />
            <Label htmlFor="emp-yes" className="cursor-pointer text-sm">Sim, quero descrever</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="emp-no" />
            <Label htmlFor="emp-no" className="cursor-pointer text-sm">Não, deixe a IA decidir</Label>
          </div>
        </RadioGroup>
        {v.bodyEmphasis.wants === "yes" && (
          <Textarea
            placeholder="Ex: quero priorizar glúteo e posterior de coxa, dar menos volume em peito..."
            value={v.bodyEmphasis.description}
            onChange={(e) => update({ bodyEmphasis: { ...v.bodyEmphasis, description: e.target.value } })}
            maxLength={500}
            className="resize-none"
            rows={3}
          />
        )}
      </Card>

      {/* 1) Divisão */}
      <Card className="p-4 border-border space-y-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Sua divisão de treino</p>
        </div>
        {split ? (
          <div className="rounded-md bg-muted/40 p-3 space-y-1">
            <p className="text-sm text-foreground font-medium">{split.name}</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {split.days.map((d) => (
                <li key={d.code}>
                  <span className="text-foreground">{d.code}:</span> {d.focus}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">A IA escolherá a divisão ideal para {trainingDays}x/semana.</p>
        )}
        <p className="text-xs text-muted-foreground">Você concorda com essa divisão?</p>
        <RadioGroup
          value={v.split.agree}
          onValueChange={(val) => update({ split: { ...v.split, agree: val as "yes" | "no" } })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="split-yes" />
            <Label htmlFor="split-yes" className="cursor-pointer text-sm">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="split-no" />
            <Label htmlFor="split-no" className="cursor-pointer text-sm">Não, justificar</Label>
          </div>
        </RadioGroup>
        {v.split.agree === "no" && (
          <Textarea
            placeholder="Ex: prefiro Push/Pull/Legs em vez de A/B/A/B..."
            value={v.split.justification}
            onChange={(e) => update({ split: { ...v.split, justification: e.target.value } })}
            maxLength={500}
            className="resize-none"
            rows={2}
          />
        )}
      </Card>

      {/* 2) Cardio */}
      <Card className="p-4 border-border space-y-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Seu cardio</p>
        </div>
        {cardioEnabled ? (
          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <p>
              <span className="text-foreground">Tipo:</span> {cardioType || "—"}
            </p>
            <p>
              <span className="text-foreground">Frequência:</span> {cardioFrequency || "—"}
            </p>
            <p>
              <span className="text-foreground">Duração:</span> {cardioDuration || "—"}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Você optou por NÃO incluir cardio.</p>
        )}
        <p className="text-xs text-muted-foreground">Você concorda?</p>
        <RadioGroup
          value={v.cardio.agree}
          onValueChange={(val) => update({ cardio: { ...v.cardio, agree: val as "yes" | "no" } })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="cardio-yes" />
            <Label htmlFor="cardio-yes" className="cursor-pointer text-sm">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="cardio-no" />
            <Label htmlFor="cardio-no" className="cursor-pointer text-sm">Não, justificar</Label>
          </div>
        </RadioGroup>
        {v.cardio.agree === "no" && (
          <Textarea
            placeholder="Ex: prefiro HIIT 2x por semana em vez de LISS diário..."
            value={v.cardio.justification}
            onChange={(e) => update({ cardio: { ...v.cardio, justification: e.target.value } })}
            maxLength={500}
            className="resize-none"
            rows={2}
          />
        )}
      </Card>

      {/* 3) Horários de refeições */}
      <Card className="p-4 border-border space-y-3">
        <div className="flex items-center gap-2">
          <Utensils size={16} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Horários das refeições</p>
        </div>
        <div className="rounded-md bg-muted/40 p-3 text-xs">
          <p className="text-foreground font-medium">{mealCount} refeições/dia</p>
          <p className="text-muted-foreground">Sugestão: {mealTimes}</p>
        </div>
        <p className="text-xs text-muted-foreground">Esses horários funcionam pra você?</p>
        <RadioGroup
          value={v.mealTimes.agree}
          onValueChange={(val) => update({ mealTimes: { ...v.mealTimes, agree: val as "yes" | "no" } })}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="meal-yes" />
            <Label htmlFor="meal-yes" className="cursor-pointer text-sm">Sim</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="meal-no" />
            <Label htmlFor="meal-no" className="cursor-pointer text-sm">Não, justificar</Label>
          </div>
        </RadioGroup>
        {v.mealTimes.agree === "no" && (
          <Textarea
            placeholder="Ex: trabalho de noite, prefiro café 11h, almoço 15h, jantar 22h..."
            value={v.mealTimes.justification}
            onChange={(e) => update({ mealTimes: { ...v.mealTimes, justification: e.target.value } })}
            maxLength={500}
            className="resize-none"
            rows={2}
          />
        )}
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        Após gerar o protocolo, você não poderá alterar por 60 dias (recálculo automático no fim do ciclo).
      </p>
    </div>
  );
};

export function isConfirmationComplete(c: ProtocolConfirmations): boolean {
  if (!c.bodyEmphasis.wants) return false;
  if (c.bodyEmphasis.wants === "yes" && !c.bodyEmphasis.description.trim()) return false;
  for (const k of ["split", "cardio", "mealTimes"] as const) {
    if (!c[k].agree) return false;
    if (c[k].agree === "no" && !c[k].justification.trim()) return false;
  }
  return true;
}
