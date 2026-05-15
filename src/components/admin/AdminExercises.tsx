import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useExercises,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  type Exercise,
} from "@/hooks/useExercises";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import VideoUploader from "@/components/admin/VideoUploader";
import { Plus, Pencil, Trash2, Search, Dumbbell, CheckCircle2, AlertTriangle } from "lucide-react";

// Normaliza nome para o lookup (igual ao usado em ExerciseVideo)
function normName(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidVideoUrl(u: string | null | undefined): boolean {
  if (!u) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`);
    return /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.gif|exercise-videos/i.test(
      url.hostname + url.pathname,
    );
  } catch {
    return false;
  }
}

const DIFFICULTIES = ["iniciante", "intermediario", "avancado"];
const PATTERNS = ["empurrar", "puxar", "agachar", "dobrar_quadril", "core", "isolado", "cardio"];
const LOAD_TYPES = ["composto", "isolado"];

const empty: Partial<Exercise> = {
  name: "",
  category: "",
  equipment: "",
  video_url: null,
  instructions: "",
  difficulty: "iniciante",
  movement_pattern: null,
  primary_muscles: [],
  secondary_muscles: [],
  load_type: null,
  tempo: "",
};

const AdminExercises = () => {
  const { data: exercises = [], isLoading } = useExercises();
  const createEx = useCreateExercise();
  const updateEx = useUpdateExercise();
  const deleteEx = useDeleteExercise();
  const { toast } = useToast();
  const logAudit = useLogAudit();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<Exercise>>(empty);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (categoryFilter !== "all" && ex.category !== categoryFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        ex.name.toLowerCase().includes(q) ||
        ex.equipment?.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q)
      );
    });
  }, [exercises, search, categoryFilter]);

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setDraft({ ...ex });
  };

  const openCreate = () => {
    setCreating(true);
    setDraft(empty);
  };

  const close = () => {
    setEditing(null);
    setCreating(false);
    setDraft(empty);
  };

  const handleSave = async () => {
    if (!draft.name?.trim() || !draft.category?.trim()) {
      toast({ title: "Preencha nome e categoria", variant: "destructive" });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      equipment: draft.equipment?.trim() || null,
      video_url: draft.video_url || null,
      instructions: draft.instructions?.trim() || null,
      difficulty: draft.difficulty || null,
      movement_pattern: draft.movement_pattern || null,
      primary_muscles: draft.primary_muscles || [],
      secondary_muscles: draft.secondary_muscles || [],
      load_type: draft.load_type || null,
      tempo: draft.tempo?.trim() || null,
    };
    try {
      if (editing) {
        await updateEx.mutateAsync({ id: editing.id, ...payload });
        await logAudit("update_exercise", null, { exercise_id: editing.id, name: payload.name });
        toast({ title: "Exercício atualizado" });
      } else {
        await createEx.mutateAsync(payload as any);
        await logAudit("create_exercise", null, { name: payload.name });
        toast({ title: "Exercício adicionado" });
      }
      close();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const ex = exercises.find((x) => x.id === deletingId);
      await deleteEx.mutateAsync(deletingId);
      await logAudit("delete_exercise", null, { exercise_id: deletingId, name: ex?.name });
      toast({ title: "Exercício removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // Diagnóstico da biblioteca de vídeos — calculado a partir dos dados já carregados
  const videoHealth = useMemo(() => {
    const total = exercises.length;
    const withVideo = exercises.filter((e) => !!e.video_url).length;
    const invalid = exercises.filter((e) => e.video_url && !isValidVideoUrl(e.video_url));
    const map: Record<string, string> = {};
    exercises.forEach((e) => {
      if (e.name && e.video_url) map[normName(e.name)] = String(e.video_url);
    });
    const samples = ["Cadeira extensora", "Mesa flexora", "Supino reto com barra"];
    const matched = samples.filter((s) => map[normName(s)]);
    const coverage = total > 0 ? Math.round((withVideo / total) * 100) : 0;
    const ok = total > 0 && invalid.length === 0 && matched.length === samples.length;
    return { total, withVideo, invalid, coverage, samples, matched, ok };
  }, [exercises]);

  return (
    <div className="space-y-3">
      {!isLoading && exercises.length > 0 && (
        <Card
          className={`p-3 border-l-4 ${
            videoHealth.ok
              ? "border-l-primary"
              : videoHealth.invalid.length > 0
              ? "border-l-destructive"
              : "border-l-amber-500"
          }`}
        >
          <div className="flex items-start gap-2">
            {videoHealth.ok ? (
              <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 text-xs space-y-1">
              <p className="font-semibold text-foreground text-sm">
                Diagnóstico da biblioteca de vídeos
              </p>
              <p className="text-muted-foreground">
                {videoHealth.withVideo} de {videoHealth.total} exercícios com vídeo (
                {videoHealth.coverage}% de cobertura)
              </p>
              <p className="text-muted-foreground">
                Lookup tolerante: {videoHealth.matched.length}/{videoHealth.samples.length}{" "}
                amostras encontradas
                {videoHealth.matched.length < videoHealth.samples.length && (
                  <span className="text-amber-500">
                    {" "}
                    (faltando:{" "}
                    {videoHealth.samples
                      .filter((s) => !videoHealth.matched.includes(s))
                      .join(", ")}
                    )
                  </span>
                )}
              </p>
              {videoHealth.invalid.length > 0 && (
                <p className="text-destructive">
                  {videoHealth.invalid.length} URL(s) de vídeo inválida(s):{" "}
                  {videoHealth.invalid
                    .slice(0, 3)
                    .map((e) => e.name)
                    .join(", ")}
                  {videoHealth.invalid.length > 3 ? "…" : ""}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, categoria ou equipamento..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1" onClick={openCreate}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Dumbbell size={12} /> {filtered.length} de {exercises.length} exercícios
      </p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.slice(0, 200).map((ex) => (
          <Card key={ex.id} className="p-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{ex.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {ex.category}
                {ex.equipment ? ` • ${ex.equipment}` : ""}
                {ex.video_url ? " • 🎥" : ""}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ex)}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeletingId(ex.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length > 200 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Mostrando 200 de {filtered.length}. Refine a busca.
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum exercício encontrado.
          </p>
        )}
      </div>

      <Dialog open={!!editing || creating} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar exercício" : "Novo exercício"}</DialogTitle>
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
                <Label>Categoria *</Label>
                <Input
                  value={draft.category || ""}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  list="ex-cat-list"
                  placeholder="Peito, Costas..."
                  className="mt-1"
                />
                <datalist id="ex-cat-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Equipamento</Label>
                <Input
                  value={draft.equipment || ""}
                  onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}
                  placeholder="Barra, halteres..."
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dificuldade</Label>
                <Select
                  value={draft.difficulty || "iniciante"}
                  onValueChange={(v) => setDraft({ ...draft, difficulty: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Padrão movimento</Label>
                <Select
                  value={draft.movement_pattern || ""}
                  onValueChange={(v) => setDraft({ ...draft, movement_pattern: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {PATTERNS.map((p) => (
                      <SelectItem key={p} value={p}>{p.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo carga</Label>
                <Select
                  value={draft.load_type || ""}
                  onValueChange={(v) => setDraft({ ...draft, load_type: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {LOAD_TYPES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tempo (ex: 2-1-1-0)</Label>
                <Input
                  value={draft.tempo || ""}
                  onChange={(e) => setDraft({ ...draft, tempo: e.target.value })}
                  placeholder="Excêntrica-Pausa-Concêntrica-Pausa"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Músculos primários (separar por vírgula)</Label>
              <Input
                value={(draft.primary_muscles || []).join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    primary_muscles: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="peitoral, triceps"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Músculos secundários (separar por vírgula)</Label>
              <Input
                value={(draft.secondary_muscles || []).join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    secondary_muscles: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="deltoide_anterior"
                className="mt-1"
              />
            </div>
            <VideoUploader
              value={draft.video_url ?? null}
              onChange={(url) => setDraft({ ...draft, video_url: url })}
            />
            <div>
              <Label>Instruções</Label>
              <Textarea
                value={draft.instructions || ""}
                onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
                placeholder="Como executar..."
                className="mt-1 h-24 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createEx.isPending || updateEx.isPending}>
              {createEx.isPending || updateEx.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar exercício?</AlertDialogTitle>
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

export default AdminExercises;
