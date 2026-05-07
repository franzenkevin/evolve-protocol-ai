import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trophy, Trash2, Plus, Pencil, Save, X } from "lucide-react";
import { useAllChallenges, useChallengeMutations, MonthlyChallenge } from "@/hooks/useChallenges";
import { toast } from "sonner";

const monthDefault = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const AdminChallenges = () => {
  const { data: challenges = [], isLoading } = useAllChallenges();
  const { create, update, remove } = useChallengeMutations();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward_points: 50,
    month_start: monthDefault(),
    active: true,
  });
  const [editForm, setEditForm] = useState<Partial<MonthlyChallenge>>({});

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Informe um título");
    try {
      await create.mutateAsync(form);
      setForm({ title: "", description: "", reward_points: 50, month_start: monthDefault(), active: true });
      toast.success("Desafio criado");
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar");
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await update.mutateAsync({ id, ...editForm });
      setEditing(null);
      toast.success("Desafio atualizado");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Plus size={16} className="text-primary" /> Novo desafio
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: 30 treinos em 30 dias" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Regras do desafio..." rows={3} />
          </div>
          <div className="space-y-1">
            <Label>Pontos de recompensa</Label>
            <Input type="number" value={form.reward_points} onChange={(e) => setForm((f) => ({ ...f, reward_points: Number(e.target.value) }))} />
          </div>
          <div className="space-y-1">
            <Label>Mês de referência</Label>
            <Input type="date" value={form.month_start} onChange={(e) => setForm((f) => ({ ...f, month_start: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} />
            <Label>Ativo</Label>
          </div>
        </div>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending ? "Criando..." : "Criar desafio"}
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Trophy size={16} className="text-warning" /> Desafios cadastrados
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum desafio cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {challenges.map((c) => {
              const isEditing = editing === c.id;
              return (
                <div key={c.id} className="border border-border rounded-md p-3 space-y-2">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input value={editForm.title ?? c.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                      <Textarea value={editForm.description ?? c.description ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" value={editForm.reward_points ?? c.reward_points} onChange={(e) => setEditForm((f) => ({ ...f, reward_points: Number(e.target.value) }))} />
                        <Input type="date" value={editForm.month_start ?? c.month_start} onChange={(e) => setEditForm((f) => ({ ...f, month_start: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={editForm.active ?? c.active} onCheckedChange={(v) => setEditForm((f) => ({ ...f, active: v }))} />
                        <Label className="text-xs">Ativo</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(c.id)} className="gap-1"><Save size={12} /> Salvar</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setEditForm({}); }} className="gap-1"><X size={12} /> Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">{c.title}</p>
                            <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge>
                            <Badge variant="outline">+{c.reward_points} pts</Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {new Date(c.month_start).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                            </Badge>
                          </div>
                          {c.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{c.description}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => { setEditing(c.id); setEditForm({}); }}>
                            <Pencil size={14} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir desafio?")) remove.mutate(c.id); }}>
                            <Trash2 size={14} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminChallenges;
