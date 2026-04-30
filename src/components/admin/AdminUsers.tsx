import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  useAdminProfiles,
  useAdminUserRoles,
  useAdminSubscriptions,
  useAdminEmails,
} from "@/hooks/useAdminData";
import { useAdminUserAction } from "@/hooks/useAdminUserAction";
import {
  ShieldCheck,
  Search,
  Pencil,
  CreditCard,
  User as UserIcon,
  Trash2,
  Ban,
  Mail,
  Gift,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BulkRegenerateCard from "./BulkRegenerateCard";

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  sex: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  onboarding_complete: boolean;
};

const AdminUsers = () => {
  const { data: profiles = [], isLoading } = useAdminProfiles();
  const { data: roles = [] } = useAdminUserRoles();
  const { data: subs = [] } = useAdminSubscriptions();
  const { data: emails = {} } = useAdminEmails();
  const action = useAdminUserAction();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Profile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null);

  const adminIds = new Set(roles.filter((r) => r.role === "admin").map((r) => r.user_id));
  const subByUser = new Map(subs.map((s) => [s.user_id, s] as const));

  const filtered = profiles.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const email = emails[p.user_id]?.toLowerCase() ?? "";
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.user_id.toLowerCase().includes(q) ||
      email.includes(q)
    );
  });

  // Profile form state
  const [pName, setPName] = useState("");
  const [pAge, setPAge] = useState("");
  const [pWeight, setPWeight] = useState("");
  const [pHeight, setPHeight] = useState("");
  const [pGoal, setPGoal] = useState("");
  const [pOnboarded, setPOnboarded] = useState(false);
  const [pEmail, setPEmail] = useState("");
  const [pPassword, setPPassword] = useState("");

  // Subscription form state
  const [sPlan, setSPlan] = useState("monthly");
  const [sStatus, setSStatus] = useState("active");
  const [sUntil, setSUntil] = useState("");

  const openEditor = (p: Profile) => {
    setEditing(p);
    setPName(p.full_name ?? "");
    setPAge(p.age?.toString() ?? "");
    setPWeight(p.weight?.toString() ?? "");
    setPHeight(p.height?.toString() ?? "");
    setPGoal(p.goal ?? "");
    setPOnboarded(p.onboarding_complete);
    setPEmail("");
    setPPassword("");

    const sub = subByUser.get(p.user_id);
    setSPlan(sub?.plan_type ?? "monthly");
    setSStatus(sub?.status ?? "active");
    setSUntil(
      sub?.current_period_end
        ? new Date(sub.current_period_end).toISOString().slice(0, 10)
        : ""
    );
  };

  const saveProfile = async () => {
    if (!editing) return;
    try {
      await action.mutateAsync({
        action: "update_profile",
        target_user_id: editing.user_id,
        payload: {
          full_name: pName || null,
          age: pAge ? Number(pAge) : null,
          weight: pWeight ? Number(pWeight) : null,
          height: pHeight ? Number(pHeight) : null,
          goal: pGoal || null,
          onboarding_complete: pOnboarded,
        },
      });
      toast({ title: "Perfil atualizado!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const saveSubscription = async () => {
    if (!editing) return;
    try {
      await action.mutateAsync({
        action: "upsert_subscription",
        target_user_id: editing.user_id,
        payload: {
          plan_type: sPlan,
          status: sStatus,
          current_period_end: sUntil ? new Date(sUntil).toISOString() : null,
          next_billing_date: sUntil || null,
          environment: "live",
        },
      });
      toast({ title: "Assinatura atualizada!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const cancelSub = async () => {
    if (!editing) return;
    try {
      await action.mutateAsync({
        action: "cancel_subscription",
        target_user_id: editing.user_id,
      });
      setSStatus("canceled");
      toast({ title: "Assinatura cancelada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const setRole = async (role: "admin" | "user") => {
    if (!editing) return;
    try {
      await action.mutateAsync({
        action: "set_role",
        target_user_id: editing.user_id,
        payload: { role },
      });
      toast({ title: role === "admin" ? "Promovido a admin" : "Rebaixado a usuário" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const updateEmail = async () => {
    if (!editing) return;
    if (!pEmail.trim()) {
      toast({ title: "Digite o novo email", variant: "destructive" });
      return;
    }
    try {
      await action.mutateAsync({
        action: "update_email",
        target_user_id: editing.user_id,
        payload: { email: pEmail.trim() },
      });
      toast({
        title: "Email alterado",
        description: "O email do usuário foi atualizado e já está confirmado.",
      });
      setPEmail("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const updatePassword = async () => {
    if (!editing) return;
    if (!pPassword || pPassword.length < 6) {
      toast({ title: "Senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    try {
      await action.mutateAsync({
        action: "update_password",
        target_user_id: editing.user_id,
        payload: { password: pPassword },
      });
      toast({
        title: "Senha redefinida",
        description: "Compartilhe a nova senha com o usuário em canal seguro.",
      });
      setPPassword("");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const grantRegen = async () => {
    if (!editing) return;
    try {
      await action.mutateAsync({
        action: "grant_protocol_regen",
        target_user_id: editing.user_id,
      });
      toast({
        title: "Regeneração liberada",
        description: "Usuário pode gerar novo protocolo agora (sem cobrança).",
      });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const regenerateProtocol = async (userId: string, name?: string | null) => {
    setRegeneratingId(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-bulk-regenerate", {
        body: {
          target_user_ids: [userId],
          reason: `Reajuste individual via admin (${name || userId})`,
        },
      });
      if (error) throw error;
      toast({
        title: "Reajuste iniciado",
        description: `Protocolo de ${name || "usuário"} sendo regerado em background. Veja resultado na aba Auditoria em ~30s.`,
      });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setRegeneratingId(null);
    }
  };

  const deleteUser = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);
    try {
      await action.mutateAsync({
        action: "delete_user",
        target_user_id: target.user_id,
      });
      setEditing(null);
      toast({ title: "Usuário deletado" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <BulkRegenerateCard />

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou ID..."
          className="pl-9"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} usuário(s)</p>

      {isLoading && <p className="text-sm text-muted-foreground py-4">Carregando...</p>}

      <div className="space-y-2">
        {filtered.map((p) => {
          const isAdmin = adminIds.has(p.user_id);
          const sub = subByUser.get(p.user_id);
          const subActive =
            sub &&
            ["active", "trialing"].includes(sub.status) &&
            (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
          return (
            <Card key={p.id} className="p-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-foreground truncate">
                    {p.full_name || "—"}
                  </p>
                  {isAdmin && (
                    <Badge variant="default" className="text-[9px] gap-1">
                      <ShieldCheck size={10} />admin
                    </Badge>
                  )}
                  {subActive ? (
                    <Badge variant="outline" className="text-[9px] gap-1 border-primary/40 text-primary">
                      <CreditCard size={10} />{sub?.plan_type}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-muted-foreground">
                      sem plano
                    </Badge>
                  )}
                </div>
                {emails[p.user_id] && (
                  <p className="text-[11px] text-foreground/80 truncate flex items-center gap-1 mt-0.5">
                    <Mail size={10} className="shrink-0 text-muted-foreground" />
                    {emails[p.user_id]}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground truncate">{p.user_id}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={() => regenerateProtocol(p.user_id, p.full_name)}
                disabled={regeneratingId === p.user_id}
                title="Reajustar protocolo deste aluno"
              >
                <RefreshCw size={12} className={regeneratingId === p.user_id ? "animate-spin" : ""} />
                {regeneratingId === p.user_id ? "..." : "Reajustar"}
              </Button>
              <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => openEditor(p as Profile)}>
                <Pencil size={12} />Editar
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription className="text-xs">
              {editing?.full_name || "—"}
              {editing && emails[editing.user_id] && ` · ${emails[editing.user_id]}`}
              {editing && ` · ${editing.user_id}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="profile" className="gap-1"><UserIcon size={12} />Perfil</TabsTrigger>
              <TabsTrigger value="access" className="gap-1"><Mail size={12} />Acesso</TabsTrigger>
              <TabsTrigger value="subscription" className="gap-1"><CreditCard size={12} />Plano</TabsTrigger>
              <TabsTrigger value="role" className="gap-1"><ShieldCheck size={12} />Role</TabsTrigger>
              <TabsTrigger value="danger" className="gap-1 text-destructive"><Ban size={12} />Risco</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-3 mt-3">
              <div><Label>Nome completo</Label><Input value={pName} onChange={(e) => setPName(e.target.value)} className="mt-1" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Idade</Label><Input type="number" value={pAge} onChange={(e) => setPAge(e.target.value)} className="mt-1" /></div>
                <div><Label>Peso (kg)</Label><Input type="number" value={pWeight} onChange={(e) => setPWeight(e.target.value)} className="mt-1" /></div>
                <div><Label>Altura (cm)</Label><Input type="number" value={pHeight} onChange={(e) => setPHeight(e.target.value)} className="mt-1" /></div>
              </div>
              <div><Label>Objetivo</Label><Input value={pGoal} onChange={(e) => setPGoal(e.target.value)} placeholder="hipertrofia, emagrecimento..." className="mt-1" /></div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="onb"
                  checked={pOnboarded}
                  onChange={(e) => setPOnboarded(e.target.checked)}
                />
                <Label htmlFor="onb" className="cursor-pointer">Onboarding concluído</Label>
              </div>
              <Button onClick={saveProfile} disabled={action.isPending} className="w-full">
                {action.isPending ? "Salvando..." : "Salvar perfil"}
              </Button>
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-3">
              {editing && emails[editing.user_id] && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Email atual</p>
                  <p className="text-sm text-foreground font-medium break-all">{emails[editing.user_id]}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Mail size={12} />Alterar email</Label>
                <Input
                  type="email"
                  value={pEmail}
                  onChange={(e) => setPEmail(e.target.value)}
                  placeholder="novo@email.com"
                />
                <p className="text-[10px] text-muted-foreground">
                  O email é trocado direto e marcado como confirmado. O usuário <strong>não</strong> precisa aprovar.
                </p>
                <Button onClick={updateEmail} disabled={action.isPending} variant="outline" className="w-full">
                  {action.isPending ? "Alterando..." : "Trocar email"}
                </Button>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <Label>Redefinir senha</Label>
                <Input
                  type="text"
                  value={pPassword}
                  onChange={(e) => setPPassword(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  autoComplete="new-password"
                />
                <p className="text-[10px] text-muted-foreground">
                  A senha é alterada imediatamente. Compartilhe com o usuário em canal seguro (WhatsApp pessoal, etc).
                </p>
                <Button onClick={updatePassword} disabled={action.isPending} variant="outline" className="w-full">
                  {action.isPending ? "Salvando..." : "Definir nova senha"}
                </Button>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <Label className="flex items-center gap-1.5"><Gift size={12} />Liberar regeneração de protocolo</Label>
                <p className="text-[10px] text-muted-foreground">
                  Concede um crédito gratuito para o usuário gerar um novo protocolo antes do prazo.
                </p>
                <Button onClick={grantRegen} disabled={action.isPending} variant="outline" className="w-full">
                  {action.isPending ? "Liberando..." : "Conceder regeneração grátis"}
                </Button>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <Label className="flex items-center gap-1.5"><RefreshCw size={12} />Reajustar protocolo agora</Label>
                <p className="text-[10px] text-muted-foreground">
                  Roda a IA novamente só para este aluno aplicando as últimas regras (jejum, horários, dieta). O protocolo atual é arquivado e um novo de 60 dias é criado.
                </p>
                <Button
                  onClick={() => editing && regenerateProtocol(editing.user_id, editing.full_name)}
                  disabled={!editing || regeneratingId === editing?.user_id}
                  variant="outline"
                  className="w-full gap-1"
                >
                  <RefreshCw size={14} className={regeneratingId === editing?.user_id ? "animate-spin" : ""} />
                  {regeneratingId === editing?.user_id ? "Reajustando..." : "Reajustar protocolo deste aluno"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-3 mt-3">
              <div>
                <Label>Plano</Label>
                <Select value={sPlan} onValueChange={setSPlan}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={sStatus} onValueChange={setSStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="trialing">Trial</SelectItem>
                    <SelectItem value="past_due">Inadimplente</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Acesso até</Label>
                <Input type="date" value={sUntil} onChange={(e) => setSUntil(e.target.value)} className="mt-1" />
                <p className="text-[10px] text-muted-foreground mt-1">Defina uma data futura para conceder acesso manual.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveSubscription} disabled={action.isPending} className="flex-1">
                  {action.isPending ? "Salvando..." : "Salvar plano"}
                </Button>
                <Button onClick={cancelSub} disabled={action.isPending} variant="outline" className="flex-1">
                  Cancelar plano
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="role" className="space-y-3 mt-3">
              <p className="text-xs text-muted-foreground">
                Admins têm acesso total ao painel e contornam paywall. Use com cautela.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setRole("admin")}
                  disabled={action.isPending || (editing && adminIds.has(editing.user_id))}
                  className="flex-1 gap-1"
                >
                  <ShieldCheck size={14} />Tornar admin
                </Button>
                <Button
                  onClick={() => setRole("user")}
                  disabled={action.isPending || (editing && !adminIds.has(editing.user_id))}
                  variant="outline"
                  className="flex-1"
                >
                  Rebaixar a usuário
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="danger" className="space-y-3 mt-3">
              <p className="text-xs text-destructive">
                Excluir o usuário é <strong>irreversível</strong>. Remove conta de auth, perfil, treinos, dieta, etc.
              </p>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => editing && setConfirmDelete(editing)}
              >
                <Trash2 size={14} />Excluir usuário permanentemente
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {confirmDelete?.full_name || "usuário"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação NÃO pode ser desfeita. Todos os dados do usuário serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground">
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
