import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFoods, useCreateFood, useUpdateFood, useDeleteFood, type Food } from "@/hooks/useFoods";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import { Plus, Trash2, Pencil, Search, Database } from "lucide-react";

const emptyDraft: Partial<Food> = {
  name: "",
  category: "",
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  calories: 0,
  portion_grams: 100,
  source: "manual",
};

const calcKcal = (p: number, c: number, f: number) =>
  Math.round(p * 4 + c * 4 + f * 9);

const AdminFoods = () => {
  const { data: foods = [], isLoading } = useFoods();
  const createFood = useCreateFood();
  const updateFood = useUpdateFood();
  const deleteFood = useDeleteFood();
  const { toast } = useToast();
  const logAudit = useLogAudit();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Food | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Food>>(emptyDraft);
  const [autoCalc, setAutoCalc] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    foods.forEach((f) => f.category && set.add(f.category));
    return Array.from(set).sort();
  }, [foods]);

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
      if (sourceFilter !== "all" && f.source !== sourceFilter) return false;
      if (!search) return true;
      return f.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [foods, search, categoryFilter, sourceFilter]);

  const computedKcal = autoCalc
    ? calcKcal(Number(draft.protein) || 0, Number(draft.carbs) || 0, Number(draft.fat) || 0)
    : Number(draft.calories) || 0;

  const openEdit = (food: Food) => {
    setEditing(food);
    setDraft({ ...food });
    setAutoCalc(false);
  };

  const openCreate = () => {
    setCreating(true);
    setDraft(emptyDraft);
    setAutoCalc(true);
  };

  const closeDialog = () => {
    setEditing(null);
    setCreating(false);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.name?.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      category: draft.category || null,
      protein: Number(draft.protein) || 0,
      carbs: Number(draft.carbs) || 0,
      fat: Number(draft.fat) || 0,
      fiber: Number(draft.fiber) || 0,
      calories: computedKcal,
      portion_grams: Number(draft.portion_grams) || 100,
      source: draft.source || "manual",
    };
    try {
      if (editing) {
        await updateFood.mutateAsync({ id: editing.id, ...payload });
        await logAudit("update_food", null, { food_id: editing.id, name: payload.name });
        toast({ title: "Alimento atualizado" });
      } else {
        await createFood.mutateAsync(payload as any);
        await logAudit("create_food", null, { name: payload.name });
        toast({ title: "Alimento adicionado" });
      }
      closeDialog();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const food = foods.find((f) => f.id === deletingId);
      await deleteFood.mutateAsync(deletingId);
      await logAudit("delete_food", null, { food_id: deletingId, name: food?.name });
      toast({ title: "Alimento removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alimento..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="taco">TACO</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1" onClick={openCreate}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Database size={12} />
        {filtered.length} de {foods.length} alimentos
        {foods.filter((f) => f.source === "taco").length > 0 && (
          <span>• {foods.filter((f) => f.source === "taco").length} da TACO</span>
        )}
      </p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.slice(0, 200).map((food) => (
          <Card key={food.id} className="p-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm text-foreground truncate">{food.name}</p>
                {food.source === "taco" && (
                  <Badge variant="outline" className="text-[9px]">TACO</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {food.category && <>{food.category} • </>}
                P:{food.protein}g C:{food.carbs}g G:{food.fat}g F:{food.fiber}g •{" "}
                <span className="text-primary font-semibold">{food.calories}kcal</span>
                {food.portion_grams !== 100 && <> /{food.portion_grams}g</>}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(food)}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeletingId(food.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length > 200 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Mostrando 200 de {filtered.length}. Refine a busca para ver mais.
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum alimento encontrado.
          </p>
        )}
      </div>

      <Dialog open={!!editing || creating} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar alimento" : "Novo alimento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Input
                  value={draft.category || ""}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  list="food-cat-list"
                  className="mt-1"
                />
                <datalist id="food-cat-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Porção (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={draft.portion_grams ?? 100}
                  onChange={(e) => setDraft({ ...draft, portion_grams: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Proteína (g)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.protein ?? 0}
                  onChange={(e) => setDraft({ ...draft, protein: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Carboidratos (g)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.carbs ?? 0}
                  onChange={(e) => setDraft({ ...draft, carbs: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Gordura (g)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.fat ?? 0}
                  onChange={(e) => setDraft({ ...draft, fat: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Fibra (g)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.fiber ?? 0}
                  onChange={(e) => setDraft({ ...draft, fiber: parseFloat(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            <Card className="p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Calorias (kcal)</Label>
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalc}
                    onChange={(e) => setAutoCalc(e.target.checked)}
                  />
                  Calcular automático (P×4 + C×4 + G×9)
                </label>
              </div>
              {autoCalc ? (
                <p className="text-2xl font-bold text-primary">{computedKcal} kcal</p>
              ) : (
                <Input
                  type="number"
                  step="1"
                  value={draft.calories ?? 0}
                  onChange={(e) => setDraft({ ...draft, calories: parseFloat(e.target.value) })}
                />
              )}
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createFood.isPending || updateFood.isPending}>
              {createFood.isPending || updateFood.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar alimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFoods;
