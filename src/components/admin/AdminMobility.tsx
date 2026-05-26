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
  useMobility,
  useCreateMobility,
  useUpdateMobility,
  useDeleteMobility,
  type MobilityExercise,
} from "@/hooks/useMobility";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import VideoUploader from "@/components/admin/VideoUploader";
import { Plus, Pencil, Trash2, Search, Activity } from "lucide-react";

const REGIONS = [
  "quadril",
  "coluna_toracica",
  "ombros",
  "tornozelo",
  "punho",
  "joelho",
  "cervical",
  "global",
];

const TYPES = ["dinamico", "estatico", "ativo", "pnf"];
const DIFFICULTIES = ["iniciante", "intermediario", "avancado"];
const SIDES = ["bilateral", "unilateral"];

const empty: Partial<MobilityExercise> = {
  name: "",
  region: "global",
  type: "dinamico",
  duration_seconds: 30,
  reps: null,
  side: "bilateral",
  equipment: "",
  video_url: null,
  image_url: null,
  instructions: "",
  difficulty: "iniciante",
};

const AdminMobility = () => {
  const { data: items = [], isLoading } = useMobility();
  const createM = useCreateMobility();
  const updateM = useUpdateMobility();
  const deleteM = useDeleteMobility();
  const { toast } = useToast();
  const logAudit = useLogAudit();

  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [editing, setEditing] = useState<MobilityExercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Partial<MobilityExercise>>(empty);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (regionFilter !== "all" && m.region !== regionFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.region.toLowerCase().includes(q) ||
        (m.equipment || "").toLowerCase().includes(q)
      );
    });
  }, [items, search, regionFilter]);

  const openEdit = (m: MobilityExercise) => {
    setEditing(m);
    setDraft({ ...m });
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
    if (!draft.name?.trim() || !draft.region?.trim()) {
      toast({ title: "Preencha nome e região", variant: "destructive" });
      return;
    }
    const payload = {
      name: draft.name.trim(),
      region: draft.region.trim(),
      type: draft.type || "dinamico",
      duration_seconds: draft.duration_seconds ?? null,
      reps: draft.reps ?? null,
      side: draft.side || "bilateral",
      equipment: draft.equipment?.trim() || null,
      video_url: draft.video_url || null,
      instructions: draft.instructions?.trim() || null,
      difficulty: draft.difficulty || "iniciante",
    };
    try {
      if (editing) {
        await updateM.mutateAsync({ id: editing.id, ...payload });
        await logAudit("update_mobility", null, { mobility_id: editing.id, name: payload.name });
        toast({ title: "Mobilidade atualizada" });
      } else {
        await createM.mutateAsync(payload as any);
        await logAudit("create_mobility", null, { name: payload.name });
        toast({ title: "Mobilidade adicionada" });
      }
      close();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const m = items.find((x) => x.id === deletingId);
      await deleteM.mutateAsync(deletingId);
      await logAudit("delete_mobility", null, { mobility_id: deletingId, name: m?.name });
      toast({ title: "Mobilidade removida" });
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
            placeholder="Buscar por nome, região, equipamento..."
            className="pl-9"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas regiões</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1" onClick={openCreate}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Activity size={12} /> {filtered.length} de {items.length} mobilidades
      </p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.slice(0, 200).map((m) => (
          <Card key={m.id} className="p-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{m.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {m.region.replace("_", " ")} • {m.type}
                {m.duration_seconds ? ` • ${m.duration_seconds}s` : ""}
                {m.reps ? ` • ${m.reps} reps` : ""}
                {m.video_url ? " • 🎥" : ""}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeletingId(m.id)}
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
            Nenhuma mobilidade encontrada.
          </p>
        )}
      </div>

      <Dialog open={!!editing || creating} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar mobilidade" : "Nova mobilidade"}</DialogTitle>
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
                <Label>Região *</Label>
                <Select
                  value={draft.region || "global"}
                  onValueChange={(v) => setDraft({ ...draft, region: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={draft.type || "dinamico"}
                  onValueChange={(v) => setDraft({ ...draft, type: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Duração (s)</Label>
                <Input
                  type="number"
                  value={draft.duration_seconds ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, duration_seconds: e.target.value ? +e.target.value : null })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reps</Label>
                <Input
                  type="number"
                  value={draft.reps ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, reps: e.target.value ? +e.target.value : null })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Lado</Label>
                <Select
                  value={draft.side || "bilateral"}
                  onValueChange={(v) => setDraft({ ...draft, side: v })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIDES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>Equipamento</Label>
                <Input
                  value={draft.equipment || ""}
                  onChange={(e) => setDraft({ ...draft, equipment: e.target.value })}
                  placeholder="Foam roller, elástico..."
                  className="mt-1"
                />
              </div>
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
            <Button onClick={handleSave} disabled={createM.isPending || updateM.isPending}>
              {createM.isPending || updateM.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar mobilidade?</AlertDialogTitle>
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

export default AdminMobility;
