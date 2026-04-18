import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  useJournalArticles,
  useCreateJournalArticle,
  useUpdateJournalArticle,
  useDeleteJournalArticle,
  useResearchJournalTopic,
  type JournalArticle,
  type JournalAIDraft,
} from "@/hooks/useJournal";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  FileText,
  ExternalLink,
  Loader2,
  Wand2,
} from "lucide-react";

const emptyDraft: Partial<JournalArticle> = {
  title: "",
  summary: "",
  excerpt: "",
  content: "",
  category: "fitness",
  image_url: "",
  source_url: "",
  read_time_minutes: 3,
  tags: [],
  status: "draft",
  ai_generated: false,
};

const AdminJournal = () => {
  const { data: articles = [], isLoading } = useJournalArticles(true);
  const createArticle = useCreateJournalArticle();
  const updateArticle = useUpdateJournalArticle();
  const deleteArticle = useDeleteJournalArticle();
  const research = useResearchJournalTopic();
  const { toast } = useToast();
  const logAudit = useLogAudit();
  const qc = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<JournalArticle | null>(null);
  const [draft, setDraft] = useState<Partial<JournalArticle>>(emptyDraft);
  const [tagsInput, setTagsInput] = useState("");
  const [aiSources, setAiSources] = useState<{ title?: string; uri: string }[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleBatchGenerate = async () => {
    if (!confirm("Gerar 5 artigos rascunho automaticamente? Pode levar 1-2 minutos.")) return;
    setBatchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("journal-batch-generate");
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["journal-articles"] });
      toast({
        title: `${data?.total || 0} rascunhos criados`,
        description: data?.errors?.length
          ? `${data.errors.length} falha(s). Veja console.`
          : "Revise e publique quando estiver pronto.",
      });
      if (data?.errors?.length) console.warn("[batch errors]", data.errors);
    } catch (e: any) {
      toast({ title: "Erro no lote", description: e.message, variant: "destructive" });
    } finally {
      setBatchLoading(false);
    }
  };

  const dialogOpen = creating || !!editing;
  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
    setDraft(emptyDraft);
    setTagsInput("");
    setAiSources([]);
    setAiPrompt("");
  };

  const openEdit = (a: JournalArticle) => {
    setEditing(a);
    setDraft({ ...a });
    setTagsInput((a.tags || []).join(", "));
    setAiSources(Array.isArray(a.ai_sources) ? (a.ai_sources as any) : []);
    setAiPrompt(a.ai_prompt || "");
  };

  const openCreate = () => {
    setCreating(true);
    setDraft({ ...emptyDraft });
    setTagsInput("");
  };

  const applyAIDraft = (d: JournalAIDraft) => {
    setDraft({
      title: d.title,
      summary: d.summary,
      excerpt: d.excerpt,
      content: d.content,
      category: d.category,
      read_time_minutes: d.read_time_minutes,
      tags: d.tags,
      ai_generated: true,
      status: "draft",
    } as Partial<JournalArticle>);
    setTagsInput((d.tags || []).join(", "));
    setAiSources(d.sources || []);
    setAiPrompt(d.ai_prompt);
  };

  const handleResearch = async () => {
    const topic = aiTopic.trim();
    if (topic.length < 3) {
      toast({ title: "Digite o tema (mín. 3 caracteres)", variant: "destructive" });
      return;
    }
    try {
      const result = await research.mutateAsync(topic);
      setCreating(true);
      applyAIDraft(result);
      setAiTopic("");
      toast({
        title: "Rascunho gerado pela IA",
        description: `${result.sources.length} fonte(s) consultadas.`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao pesquisar", description: e.message, variant: "destructive" });
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!draft.title || !draft.content) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: any = {
      title: draft.title,
      summary: draft.summary || draft.excerpt || draft.content?.slice(0, 200) || "",
      excerpt: draft.excerpt || null,
      content: draft.content,
      category: draft.category || "fitness",
      image_url: draft.image_url || null,
      source_url: draft.source_url || null,
      tags: tags.length ? tags : null,
      read_time_minutes: Number(draft.read_time_minutes) || 3,
      status: publish ? "published" : "draft",
      ai_generated: !!draft.ai_generated,
      ai_sources: aiSources.length ? aiSources : null,
      ai_prompt: aiPrompt || null,
    };

    try {
      if (editing) {
        await updateArticle.mutateAsync({ id: editing.id, ...payload });
        await logAudit(publish ? "publish_article" : "update_article", null, {
          article_id: editing.id,
          title: payload.title,
        });
        toast({ title: publish ? "Artigo publicado" : "Rascunho salvo" });
      } else {
        const inserted: any = await createArticle.mutateAsync(payload);
        await logAudit(publish ? "publish_article" : "create_draft", null, {
          article_id: inserted?.id,
          title: payload.title,
          ai_generated: payload.ai_generated,
        });
        toast({
          title: publish ? "Artigo publicado!" : "Rascunho salvo",
          description: publish ? "Notificação enviada aos usuários." : "Edite e publique quando estiver pronto.",
        });
      }
      closeDialog();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const a = articles.find((x) => x.id === deletingId);
      await deleteArticle.mutateAsync(deletingId);
      await logAudit("delete_article", null, { article_id: deletingId, title: a?.title });
      toast({ title: "Artigo removido" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const drafts = articles.filter((a) => a.status === "draft");
  const published = articles.filter((a) => a.status === "published");

  return (
    <div className="space-y-4">
      {/* IA: pesquisa de tema */}
      <Card className="p-4 card-gradient border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="font-heading font-semibold text-foreground">Pesquisar com IA</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Digite um tema. A IA pesquisa na web (Google Search), gera o rascunho com fontes,
          e você revisa antes de publicar.
        </p>
        <div className="flex gap-2">
          <Input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !research.isPending && handleResearch()}
            placeholder="Ex: creatina monohidratada e ganho de força"
            disabled={research.isPending}
          />
          <Button onClick={handleResearch} disabled={research.isPending} className="gap-1 shrink-0">
            {research.isPending ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
            {research.isPending ? "Pesquisando..." : "Gerar rascunho"}
          </Button>
        </div>
      </Card>

      {/* Gerar lote automático */}
      <Card className="p-4 card-gradient border-primary/20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Gerar lote automático
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              5 rascunhos: treino, nutrição, peptídeos, mente e suplementação.
            </p>
          </div>
          <Button onClick={handleBatchGenerate} disabled={batchLoading} size="sm" className="gap-1 glow shrink-0">
            {batchLoading ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
            {batchLoading ? "Gerando..." : "Gerar 5 artigos"}
          </Button>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>📰 {published.length} publicados</span>
          <span>•</span>
          <span>📝 {drafts.length} rascunhos</span>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={openCreate}>
          <Plus size={14} /> Manual
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {/* Rascunhos no topo */}
      {drafts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Rascunhos
          </p>
          {drafts.map((art) => (
            <ArticleRow
              key={art.id}
              article={art}
              onEdit={() => openEdit(art)}
              onDelete={() => setDeletingId(art.id)}
            />
          ))}
        </div>
      )}

      {/* Publicados */}
      {published.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            Publicados
          </p>
          {published.map((art) => (
            <ArticleRow
              key={art.id}
              article={art}
              onEdit={() => openEdit(art)}
              onDelete={() => setDeletingId(art.id)}
            />
          ))}
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum artigo ainda. Use a IA acima ou clique em "Manual".
        </p>
      )}

      {/* Dialog editor */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? "Editar artigo" : "Novo artigo"}
              {draft.ai_generated && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Sparkles size={10} /> Gerado por IA
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {aiPrompt && (
              <div className="text-xs bg-muted/50 p-2 rounded border border-border">
                <span className="text-muted-foreground">Prompt original:</span>{" "}
                <span className="text-foreground">{aiPrompt}</span>
              </div>
            )}

            <div>
              <Label>Título *</Label>
              <Input
                value={draft.title || ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Input
                  value={draft.category || ""}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tempo de leitura (min)</Label>
                <Input
                  type="number"
                  value={draft.read_time_minutes ?? 3}
                  onChange={(e) =>
                    setDraft({ ...draft, read_time_minutes: parseInt(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Chamada (excerpt)</Label>
              <Textarea
                value={draft.excerpt || ""}
                onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                className="mt-1 h-16 resize-none"
                placeholder="Aparece na lista do journal"
              />
            </div>
            <div>
              <Label>Conteúdo (markdown) *</Label>
              <Textarea
                value={draft.content || ""}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="mt-1 h-64 resize-none font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Imagem de capa (URL)</Label>
                <Input
                  value={draft.image_url || ""}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Fonte/estudo (URL)</Label>
                <Input
                  value={draft.source_url || ""}
                  onChange={(e) => setDraft({ ...draft, source_url: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="creatina, força, hipertrofia"
                className="mt-1"
              />
            </div>

            {aiSources.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Sparkles size={10} /> Fontes consultadas pela IA ({aiSources.length})
                </Label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {aiSources.map((s, i) => (
                    <a
                      key={i}
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                    >
                      <ExternalLink size={10} className="shrink-0" />
                      <span className="truncate">{s.title || s.uri}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave(false)}
              disabled={createArticle.isPending || updateArticle.isPending}
              className="gap-1"
            >
              <FileText size={14} />
              Salvar rascunho
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={createArticle.isPending || updateArticle.isPending}
              className="gap-1 glow"
            >
              <CheckCircle2 size={14} />
              {createArticle.isPending || updateArticle.isPending
                ? "Publicando..."
                : "Aprovar e publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar artigo?</AlertDialogTitle>
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

const ArticleRow = ({
  article,
  onEdit,
  onDelete,
}: {
  article: JournalArticle;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <Card className="p-3 flex items-center gap-3">
    {article.image_url && (
      <img
        src={article.image_url}
        alt={article.title}
        className="w-14 h-14 rounded object-cover shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-sm text-foreground line-clamp-1">{article.title}</p>
        {article.ai_generated && (
          <Badge variant="outline" className="text-[9px] gap-0.5">
            <Sparkles size={9} />
            IA
          </Badge>
        )}
        <Badge
          variant={article.status === "published" ? "default" : "outline"}
          className="text-[9px]"
        >
          {article.status === "published" ? "publicado" : "rascunho"}
        </Badge>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        {article.category && (
          <Badge variant="outline" className="text-[9px] py-0">
            {article.category}
          </Badge>
        )}
        <span>{new Date(article.published_at).toLocaleDateString("pt-BR")}</span>
      </div>
    </div>
    <div className="flex gap-1 shrink-0">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Pencil size={14} />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 size={14} />
      </Button>
    </div>
  </Card>
);

export default AdminJournal;
