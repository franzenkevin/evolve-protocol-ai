import { useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Plus, Trash2, ChevronsUpDown, Info, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useFoods, type Food } from "@/hooks/useFoods";
import { useActiveProtocol } from "@/hooks/useProtocol";
import {
  useFoodDiary,
  useAddDiaryEntry,
  useUpdateDiaryEntry,
  useDeleteDiaryEntry,
  todayStr,
} from "@/hooks/useFoodDiary";
import { useTodayDietFeedback, useUpsertDietFeedback } from "@/hooks/useDietFeedback";
import { toast } from "sonner";

const fmtDate = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
};

const shift = (d: string, days: number) => {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
};

const FoodDiary = () => {
  const [date, setDate] = useState<string>(todayStr());
  const isToday = date === todayStr();
  const isFuture = date > todayStr();

  const { data: foods = [] } = useFoods();
  const { data: protocol } = useActiveProtocol();
  const { data: entries = [], isLoading } = useFoodDiary(date);
  const add = useAddDiaryEntry();
  const update = useUpdateDiaryEntry();
  const del = useDeleteDiaryEntry();
  const { data: feedback } = useTodayDietFeedback();
  const upsertFeedback = useUpsertDietFeedback();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const diet = protocol?.diet as any;
  const targets = {
    calories: Number(diet?.totalCalories) || 0,
    protein: Number(diet?.protein) || 0,
    carbs: Number(diet?.carbs) || 0,
    fat: Number(diet?.fat) || 0,
  };

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + Number(e.calories || 0),
        protein: acc.protein + Number(e.protein || 0),
        carbs: acc.carbs + Number(e.carbs || 0),
        fat: acc.fat + Number(e.fat || 0),
        fiber: acc.fiber + Number(e.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }, [entries]);

  const remaining = {
    calories: Math.round(targets.calories - totals.calories),
    protein: +(targets.protein - totals.protein).toFixed(1),
    carbs: +(targets.carbs - totals.carbs).toFixed(1),
    fat: +(targets.fat - totals.fat).toFixed(1),
  };

  const handleAdd = async (food: Food, grams: number) => {
    if (!isToday) return;
    const ratio = grams / (Number(food.portion_grams) || 100);
    try {
      await add.mutateAsync({
        food_id: food.id,
        name: food.name,
        grams,
        protein: +(Number(food.protein) * ratio).toFixed(2),
        carbs: +(Number(food.carbs) * ratio).toFixed(2),
        fat: +(Number(food.fat) * ratio).toFixed(2),
        fiber: +(Number(food.fiber) * ratio).toFixed(2),
        calories: +(Number(food.calories) * ratio).toFixed(2),
        meal_label: null,
      });
      setPickerOpen(false);
      setSearch("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao adicionar");
    }
  };

  const handleUpdateGrams = async (entry: any, grams: number) => {
    if (!isToday) return;
    // Recalculate from original food when possible
    const food = foods.find((f) => f.id === entry.food_id);
    if (!food) {
      // proportional from existing entry
      const r = grams / Math.max(1, Number(entry.grams));
      await update.mutateAsync({
        id: entry.id,
        grams,
        protein: +(Number(entry.protein) * r).toFixed(2),
        carbs: +(Number(entry.carbs) * r).toFixed(2),
        fat: +(Number(entry.fat) * r).toFixed(2),
        fiber: +(Number(entry.fiber) * r).toFixed(2),
        calories: +(Number(entry.calories) * r).toFixed(2),
      });
      return;
    }
    const ratio = grams / (Number(food.portion_grams) || 100);
    await update.mutateAsync({
      id: entry.id,
      grams,
      protein: +(Number(food.protein) * ratio).toFixed(2),
      carbs: +(Number(food.carbs) * ratio).toFixed(2),
      fat: +(Number(food.fat) * ratio).toFixed(2),
      fiber: +(Number(food.fiber) * ratio).toFixed(2),
      calories: +(Number(food.calories) * ratio).toFixed(2),
    });
  };

  const saveAsFeedback = async () => {
    if (!isToday) return;
    const adherence = targets.calories
      ? Math.max(0, Math.min(100, Math.round(100 - (Math.abs(totals.calories - targets.calories) / targets.calories) * 100)))
      : 100;
    try {
      await upsertFeedback.mutateAsync({
        adherence,
        notes: `Diário alimentar: ${Math.round(totals.calories)} kcal · P${totals.protein.toFixed(0)}g C${totals.carbs.toFixed(0)}g G${totals.fat.toFixed(0)}g (alvo: ${targets.calories} kcal)`,
      });
      toast.success("Feedback do dia salvo no progresso!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar feedback");
    }
  };

  const pct = (curr: number, tgt: number) => (tgt > 0 ? Math.min(100, (curr / tgt) * 100) : 0);

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <div className="flex items-center gap-2 pt-2">
          <BookOpen size={22} className="text-primary" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Diário alimentar</h1>
        </div>

        {/* Explanation */}
        <Card className="p-3 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sempre que possível, siga a dieta proposta. Caso precise flexibilizar, use o diário
              para registrar suas trocas e manter os <span className="text-foreground font-medium">macros</span> —
              essa é a parte mais importante para o seu processo.
            </p>
          </div>
        </Card>

        {/* Date selector */}
        <Card className="p-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setDate(shift(date, -1))} aria-label="Dia anterior">
            <ChevronLeft size={16} />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays size={14} className="text-primary" />
            <span className="font-medium text-foreground capitalize">{fmtDate(date)}</span>
            {isToday && <Badge variant="secondary" className="text-[10px]">Hoje</Badge>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDate(shift(date, 1))}
            disabled={isToday}
            aria-label="Próximo dia"
          >
            <ChevronRight size={16} />
          </Button>
        </Card>

        {/* Targets vs consumed */}
        <Card className="p-4 card-gradient border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-foreground">Macros do dia</h3>
            <span className="text-[10px] text-muted-foreground">
              alvo {targets.calories} kcal
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{Math.round(totals.calories)}</p>
              <p className="text-[10px] text-muted-foreground">Kcal</p>
              <p className={`text-[10px] ${remaining.calories < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {remaining.calories >= 0 ? `faltam ${remaining.calories}` : `+${Math.abs(remaining.calories)}`}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-info">{totals.protein.toFixed(0)}g</p>
              <p className="text-[10px] text-muted-foreground">Prot ({targets.protein}g)</p>
              <p className={`text-[10px] ${remaining.protein < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {remaining.protein >= 0 ? `${remaining.protein}g` : `+${Math.abs(remaining.protein)}g`}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">{totals.carbs.toFixed(0)}g</p>
              <p className="text-[10px] text-muted-foreground">Carb ({targets.carbs}g)</p>
              <p className={`text-[10px] ${remaining.carbs < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {remaining.carbs >= 0 ? `${remaining.carbs}g` : `+${Math.abs(remaining.carbs)}g`}
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">{totals.fat.toFixed(0)}g</p>
              <p className="text-[10px] text-muted-foreground">Gord ({targets.fat}g)</p>
              <p className={`text-[10px] ${remaining.fat < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {remaining.fat >= 0 ? `${remaining.fat}g` : `+${Math.abs(remaining.fat)}g`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={pct(totals.calories, targets.calories)} className="h-1.5" />
          </div>
        </Card>

        {/* Add food */}
        {isToday ? (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between" size="sm">
                <span className="flex items-center gap-2">
                  <Plus size={14} /> Adicionar alimento
                </span>
                <ChevronsUpDown size={14} className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar alimento..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>Nenhum alimento encontrado.</CommandEmpty>
                  <CommandGroup>
                    {foods.slice(0, 200).map((f) => (
                      <CommandItem
                        key={f.id}
                        value={f.name}
                        onSelect={() => handleAdd(f, Number(f.portion_grams) || 100)}
                      >
                        <span className="flex-1">{f.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(f.calories)} kcal/{f.portion_grams}g
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        ) : (
          <Card className="p-3 border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {isFuture
                ? "Você só pode registrar alimentos no dia atual."
                : "Esse dia já passou. Você pode apenas consultar o que foi registrado."}
            </p>
          </Card>
        )}

        {/* Entries */}
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        ) : entries.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-sm text-muted-foreground">
              Nenhum alimento registrado {isToday ? "hoje" : "neste dia"}.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <Card key={e.id} className="p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round(Number(e.calories))} kcal • P{Number(e.protein).toFixed(1)}g
                    C{Number(e.carbs).toFixed(1)}g G{Number(e.fat).toFixed(1)}g
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    defaultValue={Number(e.grams)}
                    disabled={!isToday}
                    className="w-20 h-8 text-sm"
                    onBlur={(ev) => {
                      const v = Number(ev.target.value) || 0;
                      if (v !== Number(e.grams)) handleUpdateGrams(e, v);
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">g</span>
                  {isToday && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => del.mutate(e.id)}
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Save as feedback */}
        {isToday && entries.length > 0 && (
          <Card className="p-4 border-border space-y-3">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Usar como feedback do dia
              </Label>
              <p className="text-[11px] text-muted-foreground mt-1">
                Salva no seu progresso que você seguiu a dieta hoje, com base nos macros consumidos.
                {feedback && " (já existe um feedback de hoje — será atualizado)"}
              </p>
            </div>
            <Button onClick={saveAsFeedback} disabled={upsertFeedback.isPending} className="w-full">
              {upsertFeedback.isPending ? "Salvando..." : "Salvar feedback do dia"}
            </Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default FoodDiary;
