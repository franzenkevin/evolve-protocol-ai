import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import { Calculator, Plus, Trash2, ChevronsUpDown } from "lucide-react";
import { useFoods, type Food } from "@/hooks/useFoods";

interface RecipeItem {
  food: Food;
  grams: number;
}

interface RecipeCalculatorProps {
  trigger?: React.ReactNode;
}

const RecipeCalculator = ({ trigger }: RecipeCalculatorProps) => {
  const { data: foods = [] } = useFoods();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [servings, setServings] = useState(1);

  const addFood = (food: Food) => {
    setItems((prev) => [...prev, { food, grams: 100 }]);
    setPickerOpen(false);
  };

  const updateGrams = (idx: number, grams: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, grams } : it))
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    const t = items.reduce(
      (acc, it) => {
        const ratio = it.grams / (it.food.portion_grams || 100);
        return {
          protein: acc.protein + (Number(it.food.protein) || 0) * ratio,
          carbs: acc.carbs + (Number(it.food.carbs) || 0) * ratio,
          fat: acc.fat + (Number(it.food.fat) || 0) * ratio,
          fiber: acc.fiber + (Number(it.food.fiber) || 0) * ratio,
          calories: acc.calories + (Number(it.food.calories) || 0) * ratio,
          grams: acc.grams + it.grams,
        };
      },
      { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0, grams: 0 }
    );
    return t;
  }, [items]);

  const s = Math.max(1, servings);
  const perServing = {
    protein: totals.protein / s,
    carbs: totals.carbs / s,
    fat: totals.fat / s,
    fiber: totals.fiber / s,
    calories: totals.calories / s,
    grams: totals.grams / s,
  };

  const reset = () => {
    setItems([]);
    setRecipeName("");
    setServings(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-2">
            <Calculator size={14} />
            Calcular receita
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            Calculadora de receita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Nome da receita (opcional)</Label>
              <Input
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="Ex: Panqueca fit"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Porções</Label>
              <Input
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus size={14} /> Adicionar alimento
                </span>
                <ChevronsUpDown size={14} className="opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar alimento..." />
                <CommandList>
                  <CommandEmpty>Nenhum alimento encontrado.</CommandEmpty>
                  <CommandGroup>
                    {foods.slice(0, 200).map((f) => (
                      <CommandItem
                        key={f.id}
                        value={f.name}
                        onSelect={() => addFood(f)}
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

          {items.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Adicione alimentos para calcular os macros da receita.
            </p>
          )}

          {items.map((it, idx) => {
            const ratio = it.grams / (it.food.portion_grams || 100);
            const kcal = Math.round((Number(it.food.calories) || 0) * ratio);
            return (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {it.food.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {kcal} kcal • P:{(Number(it.food.protein) * ratio).toFixed(1)}g
                    C:{(Number(it.food.carbs) * ratio).toFixed(1)}g
                    G:{(Number(it.food.fat) * ratio).toFixed(1)}g
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={it.grams}
                  onChange={(e) => updateGrams(idx, Number(e.target.value) || 0)}
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">g</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            );
          })}

          {items.length > 0 && (
            <Card className="p-3 card-gradient border-border space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Total ({Math.round(totals.grams)}g)
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-base font-bold text-primary">{Math.round(totals.calories)}</p>
                    <p className="text-[10px] text-muted-foreground">Kcal</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-info">{totals.protein.toFixed(1)}g</p>
                    <p className="text-[10px] text-muted-foreground">Prot</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-warning">{totals.carbs.toFixed(1)}g</p>
                    <p className="text-[10px] text-muted-foreground">Carb</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-destructive">{totals.fat.toFixed(1)}g</p>
                    <p className="text-[10px] text-muted-foreground">Gord</p>
                  </div>
                </div>
                {totals.fiber > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center mt-1">
                    Fibras: {totals.fiber.toFixed(1)}g
                  </p>
                )}
              </div>

              {servings > 1 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Por porção ({Math.round(perServing.grams)}g)
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-primary">{Math.round(perServing.calories)}</p>
                      <p className="text-[10px] text-muted-foreground">Kcal</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-info">{perServing.protein.toFixed(1)}g</p>
                      <p className="text-[10px] text-muted-foreground">Prot</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-warning">{perServing.carbs.toFixed(1)}g</p>
                      <p className="text-[10px] text-muted-foreground">Carb</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-destructive">{perServing.fat.toFixed(1)}g</p>
                      <p className="text-[10px] text-muted-foreground">Gord</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={reset} disabled={items.length === 0}>
            Limpar
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeCalculator;
