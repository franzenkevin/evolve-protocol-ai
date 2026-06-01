import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Plus,
  Trash2,
  Info,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Search,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  X,
  Minus,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { useFoods, type Food } from "@/hooks/useFoods";
import { useActiveProtocol } from "@/hooks/useProtocol";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  useFoodDiary,
  useAddDiaryEntry,
  useUpdateDiaryEntry,
  useDeleteDiaryEntry,
  todayStr,
} from "@/hooks/useFoodDiary";
import { useTodayDietFeedback, useUpsertDietFeedback } from "@/hooks/useDietFeedback";
import { toast } from "sonner";

type MealKey = "breakfast" | "lunch" | "dinner" | "snacks";

const MEALS: { key: MealKey; label: string; icon: any; color: string }[] = [
  { key: "breakfast", label: "Café da Manhã", icon: Sunrise, color: "text-warning" },
  { key: "lunch", label: "Almoço", icon: Sun, color: "text-info" },
  { key: "dinner", label: "Jantar", icon: Sunset, color: "text-destructive" },
  { key: "snacks", label: "Lanches / Outros", icon: Moon, color: "text-primary" },
];

const QUICK_GRAMS = [30, 50, 100, 150, 200, 250];

const fmtDate = (d: string) => {
  const dt = new Date(d + "T12:00:00");
  return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
};

const shift = (d: string, days: number) => {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
};

// Recent foods used by this user (past 14 days, deduped, most-recent first)
const useRecentFoods = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recent-foods", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data, error } = await supabase
        .from("food_diary_entries" as any)
        .select("food_id, created_at")
        .eq("user_id", user.id)
        .gte("entry_date", since.toISOString().slice(0, 10))
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return [] as string[];
      const ids: string[] = [];
      for (const row of (data || []) as any[]) {
        if (row.food_id && !ids.includes(row.food_id)) ids.push(row.food_id);
        if (ids.length >= 12) break;
      }
      return ids;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};

const FoodDiary = () => {
  const [date, setDate] = useState<string>(todayStr());
  const isToday = date === todayStr();
  const isFuture = date > todayStr();

  const { data: foods = [] } = useFoods();
  const { data: protocol } = useActiveProtocol();
  const { data: entries = [], isLoading } = useFoodDiary(date);
  const { data: recentIds = [] } = useRecentFoods();
  const add = useAddDiaryEntry();
  const update = useUpdateDiaryEntry();
  const del = useDeleteDiaryEntry();
  const { data: feedback } = useTodayDietFeedback();
  const upsertFeedback = useUpsertDietFeedback();

  const [pickerMeal, setPickerMeal] = useState<MealKey | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [portion, setPortion] = useState<number>(100);

  // debounce search for snappy typing on 667 items
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 120);
    return () => clearTimeout(t);
  }, [search]);

  const diet = protocol?.diet as any;
  const targets = {
    calories: Number(diet?.totalCalories) || 0,
    protein: Number(diet?.protein) || 0,
    carbs: Number(diet?.carbs) || 0,
    fat: Number(diet?.fat) || 0,
  };

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + Number(e.calories || 0),
          protein: acc.protein + Number(e.protein || 0),
          carbs: acc.carbs + Number(e.carbs || 0),
          fat: acc.fat + Number(e.fat || 0),
          fiber: acc.fiber + Number(e.fiber || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      ),
    [entries],
  );

  const remaining = {
    calories: Math.round(targets.calories - totals.calories),
    protein: +(targets.protein - totals.protein).toFixed(1),
    carbs: +(targets.carbs - totals.carbs).toFixed(1),
    fat: +(targets.fat - totals.fat).toFixed(1),
  };

  const entriesByMeal = useMemo(() => {
    const map: Record<MealKey, typeof entries> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    for (const e of entries) {
      const k = (e.meal_label as MealKey) || "snacks";
      if (map[k]) map[k].push(e);
      else map.snacks.push(e);
    }
    return map;
  }, [entries]);

  const mealTotals = (k: MealKey) =>
    entriesByMeal[k].reduce((s, e) => s + Number(e.calories || 0), 0);

  const foodsById = useMemo(() => {
    const m = new Map<string, Food>();
    foods.forEach((f) => m.set(f.id, f));
    return m;
  }, [foods]);

  const recentFoods = useMemo(
    () => recentIds.map((id) => foodsById.get(id)).filter(Boolean) as Food[],
    [recentIds, foodsById],
  );

  // Smart ranked search: starts-with > word-boundary > contains
  const filteredFoods = useMemo(() => {
    const q = debouncedSearch;
    if (!q) return foods.slice(0, 60);
    const rank = (name: string) => {
      const n = name.toLowerCase();
      if (n.startsWith(q)) return 0;
      if (n.includes(" " + q) || n.includes("(" + q)) return 1;
      if (n.includes(q)) return 2;
      return 3;
    };
    return foods
      .filter((f) => f.name.toLowerCase().includes(q))
      .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
      .slice(0, 120);
  }, [foods, debouncedSearch]);

  // --- Portion confirmation ---
  const openPortion = (food: Food) => {
    setSelectedFood(food);
    setPortion(Number(food.portion_grams) || 100);
  };

  const macrosFor = (food: Food, grams: number) => {
    const ratio = grams / (Number(food.portion_grams) || 100);
    return {
      calories: Number(food.calories) * ratio,
      protein: Number(food.protein) * ratio,
      carbs: Number(food.carbs) * ratio,
      fat: Number(food.fat) * ratio,
      fiber: Number(food.fiber) * ratio,
    };
  };

  const confirmAdd = async () => {
    if (!isToday || !pickerMeal || !selectedFood) return;
    const g = Math.max(1, Math.round(portion));
    const m = macrosFor(selectedFood, g);
    try {
      await add.mutateAsync({
        food_id: selectedFood.id,
        name: selectedFood.name,
        grams: g,
        protein: +m.protein.toFixed(2),
        carbs: +m.carbs.toFixed(2),
        fat: +m.fat.toFixed(2),
        fiber: +m.fiber.toFixed(2),
        calories: +m.calories.toFixed(2),
        meal_label: pickerMeal,
      });
      toast.success(`${selectedFood.name} adicionado`);
      setSelectedFood(null);
      setSearch("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao adicionar");
    }
  };

  const handleUpdateGrams = async (entry: any, grams: number) => {
    if (!isToday) return;
    const food = foods.find((f) => f.id === entry.food_id);
    if (!food) {
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
    const m = macrosFor(food, grams);
    await update.mutateAsync({
      id: entry.id,
      grams,
      protein: +m.protein.toFixed(2),
      carbs: +m.carbs.toFixed(2),
      fat: +m.fat.toFixed(2),
      fiber: +m.fiber.toFixed(2),
      calories: +m.calories.toFixed(2),
    });
  };

  const saveAsFeedback = async () => {
    if (!isToday) return;
    const adherence = targets.calories
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              100 - (Math.abs(totals.calories - targets.calories) / targets.calories) * 100,
            ),
          ),
        )
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

  const previewMacros = selectedFood ? macrosFor(selectedFood, Math.max(1, Math.round(portion))) : null;

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in pb-24">
        <div className="flex items-center gap-2 pt-2">
          <BookOpen size={22} className="text-primary" />
          <h1 className="text-2xl font-heading font-bold text-foreground">Diário alimentar</h1>
        </div>

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

        {/* Calories summary */}
        <Card className="p-4 card-gradient border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Calorias Restantes</span>
            <span className={`font-heading font-bold text-lg ${remaining.calories < 0 ? "text-destructive" : "text-foreground"}`}>
              {remaining.calories}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Calorias Consumidas</span>
            <span className="font-heading font-bold text-lg text-primary">
              {Math.round(totals.calories)}
            </span>
          </div>
          <Progress
            value={targets.calories ? Math.min(100, (totals.calories / targets.calories) * 100) : 0}
            className="h-1.5 mt-3"
          />
          <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-3 border-t border-border">
            <div>
              <p className="text-sm font-bold text-info">{totals.protein.toFixed(0)}g</p>
              <p className="text-[10px] text-muted-foreground">Prot · alvo {targets.protein}g</p>
            </div>
            <div>
              <p className="text-sm font-bold text-warning">{totals.carbs.toFixed(0)}g</p>
              <p className="text-[10px] text-muted-foreground">Carb · alvo {targets.carbs}g</p>
            </div>
            <div>
              <p className="text-sm font-bold text-destructive">{totals.fat.toFixed(0)}g</p>
              <p className="text-[10px] text-muted-foreground">Gord · alvo {targets.fat}g</p>
            </div>
          </div>
        </Card>

        {/* Helper */}
        <Card className="p-3 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Toque em <span className="text-foreground font-medium">+</span> em qualquer refeição
              para buscar entre <span className="text-foreground font-medium">{foods.length}</span> alimentos.
            </p>
          </div>
        </Card>

        {/* Meal sections */}
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        ) : (
          <div className="space-y-2">
            {MEALS.map(({ key, label, icon: Icon, color }) => {
              const items = entriesByMeal[key];
              const kcal = mealTotals(key);
              return (
                <Card key={key} className="overflow-hidden">
                  <div className="p-3 flex items-center gap-3">
                    <Icon size={20} className={color} />
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-foreground">{label}</p>
                      {items.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {items.length} {items.length === 1 ? "item" : "itens"} · {Math.round(kcal)} kcal
                        </p>
                      )}
                    </div>
                    {isToday && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-primary"
                        onClick={() => {
                          setSearch("");
                          setPickerMeal(key);
                        }}
                        aria-label={`Adicionar em ${label}`}
                      >
                        <Plus size={20} />
                      </Button>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="border-t border-border divide-y divide-border">
                      {items.map((e) => (
                        <div key={e.id} className="px-3 py-2 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{e.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {Math.round(Number(e.calories))} kcal · P{Number(e.protein).toFixed(0)}g
                              C{Number(e.carbs).toFixed(0)}g G{Number(e.fat).toFixed(0)}g
                            </p>
                          </div>
                          {isToday && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleUpdateGrams(e, Math.max(1, Number(e.grams) - 10))}
                              aria-label="Diminuir 10g"
                            >
                              <Minus size={12} />
                            </Button>
                          )}
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            defaultValue={Number(e.grams)}
                            disabled={!isToday}
                            className="w-14 h-8 text-xs text-center px-1"
                            key={`${e.id}-${e.grams}`}
                            onBlur={(ev) => {
                              const v = Number(ev.target.value) || 0;
                              if (v > 0 && v !== Number(e.grams)) handleUpdateGrams(e, v);
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground">g</span>
                          {isToday && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleUpdateGrams(e, Number(e.grams) + 10)}
                              aria-label="Aumentar 10g"
                            >
                              <Plus size={12} />
                            </Button>
                          )}
                          {isToday && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => del.mutate(e.id)}
                              aria-label="Remover"
                            >
                              <Trash2 size={12} className="text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {!isToday && (
          <Card className="p-3 border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {isFuture
                ? "Você só pode registrar alimentos no dia atual."
                : "Esse dia já passou. Você pode apenas consultar."}
            </p>
          </Card>
        )}

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

      {/* Food picker */}
      <Dialog
        open={pickerMeal !== null}
        onOpenChange={(o) => {
          if (!o) {
            setPickerMeal(null);
            setSelectedFood(null);
          }
        }}
      >
        <DialogContent className="max-w-md p-0 gap-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {selectedFood && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSelectedFood(null)}
                    aria-label="Voltar"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                )}
                <div className="min-w-0">
                  <DialogTitle className="font-heading text-base truncate">
                    {selectedFood
                      ? selectedFood.name
                      : MEALS.find((m) => m.key === pickerMeal)?.label}
                  </DialogTitle>
                  <DialogDescription className="text-[11px] capitalize">
                    {selectedFood ? "Definir porção" : fmtDate(date)}
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setPickerMeal(null);
                  setSelectedFood(null);
                }}
                aria-label="Fechar"
              >
                <X size={16} />
              </Button>
            </div>
          </DialogHeader>

          {/* Step 1: search list */}
          {!selectedFood && (
            <>
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder={`Pesquisar entre ${foods.length} alimentos…`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-9 h-10"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Limpar busca"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1">
                {!debouncedSearch && recentFoods.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                      <Clock size={12} className="text-muted-foreground" />
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Usados recentemente
                      </p>
                    </div>
                    <ul className="divide-y divide-border">
                      {recentFoods.map((f) => (
                        <FoodRow key={`r-${f.id}`} food={f} onPick={openPortion} />
                      ))}
                    </ul>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Todos os alimentos
                      </p>
                    </div>
                  </div>
                )}

                {filteredFoods.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Nenhum alimento encontrado.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredFoods.map((f) => (
                      <FoodRow key={f.id} food={f} onPick={openPortion} />
                    ))}
                  </ul>
                )}
                <div className="h-4" />
              </ScrollArea>
            </>
          )}

          {/* Step 2: portion editor */}
          {selectedFood && previewMacros && (
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="text-center space-y-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Porção
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setPortion((p) => Math.max(1, Math.round(p) - 10))}
                    aria-label="-10g"
                  >
                    <Minus size={16} />
                  </Button>
                  <div className="flex items-baseline gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={portion}
                      onChange={(e) => setPortion(Number(e.target.value) || 0)}
                      className="w-24 h-12 text-2xl font-heading font-bold text-center"
                    />
                    <span className="text-base text-muted-foreground">g</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setPortion((p) => Math.round(p) + 10)}
                    aria-label="+10g"
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Padrão do alimento: {selectedFood.portion_grams}g
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center">
                {QUICK_GRAMS.map((g) => (
                  <Button
                    key={g}
                    variant={Math.round(portion) === g ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setPortion(g)}
                  >
                    {g}g
                  </Button>
                ))}
                <Button
                  variant={Math.round(portion) === Number(selectedFood.portion_grams) ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setPortion(Number(selectedFood.portion_grams) || 100)}
                >
                  1 porção
                </Button>
              </div>

              <Card className="p-3 card-gradient border-border">
                <div className="text-center mb-2">
                  <p className="text-3xl font-heading font-bold text-primary">
                    {Math.round(previewMacros.calories)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    kcal
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-border">
                  <div>
                    <p className="text-sm font-bold text-info">{previewMacros.protein.toFixed(1)}g</p>
                    <p className="text-[9px] text-muted-foreground">Proteína</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warning">{previewMacros.carbs.toFixed(1)}g</p>
                    <p className="text-[9px] text-muted-foreground">Carbo</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-destructive">{previewMacros.fat.toFixed(1)}g</p>
                    <p className="text-[9px] text-muted-foreground">Gordura</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{previewMacros.fiber.toFixed(1)}g</p>
                    <p className="text-[9px] text-muted-foreground">Fibra</p>
                  </div>
                </div>
              </Card>

              <Button
                onClick={confirmAdd}
                disabled={add.isPending || portion < 1}
                className="w-full h-11"
                size="lg"
              >
                {add.isPending
                  ? "Adicionando…"
                  : `Adicionar em ${MEALS.find((m) => m.key === pickerMeal)?.label}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

const FoodRow = ({ food, onPick }: { food: Food; onPick: (f: Food) => void }) => (
  <li>
    <button
      type="button"
      className="w-full text-left px-4 py-2.5 hover:bg-muted/50 active:bg-muted transition-colors flex items-center gap-3"
      onClick={() => onPick(food)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{food.name}</p>
        <p className="text-[11px] text-primary">
          {food.portion_grams}g
          <span className="text-muted-foreground">
            {" "}· {Math.round(food.calories)} kcal · P{Number(food.protein).toFixed(0)} C
            {Number(food.carbs).toFixed(0)} G{Number(food.fat).toFixed(0)}
          </span>
        </p>
      </div>
      <Plus size={16} className="text-primary shrink-0" />
    </button>
  </li>
);

export default FoodDiary;
