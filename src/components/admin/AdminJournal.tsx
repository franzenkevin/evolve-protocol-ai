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
  useSearchJournalStudies,
  useExpandJournalStudy,
  type JournalArticle,
  type JournalAIDraft,
  type JournalStudySuggestion,
} from "@/hooks/useJournal";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
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
  Search,
  BookOpen,
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
  const searchStudies = useSearchJournalStudies();
  const expandStudy = useExpandJournalStudy();
  const { toast } = useToast();
  const logAudit = useLogAudit();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<JournalArticle | null>(null);
  const [draft, setDraft] = useState<Partial<JournalArticle>>(emptyDraft);
  const [tagsInput, setTagsInput] = useState("");
  const [aiSources, setAiSources] = useState<{ title?: string; uri: string }[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [studies, setStudies] = useState<JournalStudySuggestion[]>([]);
  const [searchedTopic, setSearchedTopic] = useState("");
  const [expandingIdx, setExpandingIdx] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      source_url: d.source_url || "",
      ai_generated: true,
      status: "draft",
    } as Partial<JournalArticle>);
    setTagsInput((d.tags || []).join(", "));
    setAiSources(d.sources || []);
    setAiPrompt(d.ai_prompt);
  };

  const handleSearchStudies = async () => {
    const topic = aiTopic.trim();
    if (topic.length < 3) {
      toast({ title: "Digite o tema (mín. 3 caracteres)", variant: "destructive" });
      return;
    }
    try {
      const result = await searchStudies.mutateAsync(topic);
      setStudies(result.studies);
      setSearchedTopic(result.topic);
      toast({
        title: `${result.studies.length} estudo(s) encontrado(s)`,
        description: "Escolha um para gerar o artigo.",
      });
    } catch (e: any) {
      setStudies([]);
      toast({ title: "Erro ao buscar estudos", description: e.message, variant: "destructive" });
    }
  };

  const handleExpandStudy = async (study: JournalStudySuggestion, idx: number) => {
    setExpandingIdx(idx);
    try {
      const draftResult = await expandStudy.mutateAsync({
        topic: searchedTopic,
        selected: study,
      });
      setCreating(true);
      applyAIDraft(draftResult);
      // limpa lista após escolher
      setStudies([]);
      setSearchedTopic("");
      setAiTopic("");
      toast({
        title: "Artigo gerado a partir do estudo",
        description: study.study_title.slice(0, 80),
      });
    } catch (e: any) {
      toast({ title: "Erro ao gerar artigo", description: e.message, variant: "destructive" });
    } finally {
      setExpandingIdx(null);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!draft.title || !draft.content) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }
    // Para artigos gerados por IA, source_url é obrigatório (referência do estudo)
    if (draft.ai_generated && !draft.source_url) {
      toast({
        title: "Fonte obrigatória",
        description: "Artigos gerados por IA precisam manter o link do estudo.",
        variant: "destructive",
      });
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
      {/* IA: pesquisa de estudos */}
      <Card className="p-4 card-gradient border-primary/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="font-heading font-semibold text-foreground">Pesquisar estudos científicos</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Digite um tema. A IA busca no Google Scholar / PubMed e devolve <strong>3 estudos reais</strong>
          {" "}com link da referência. Você escolhe um e a IA gera o artigo já com a fonte.
        </p>
        <div className="flex gap-2">
          <Input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !searchStudies.isPending && handleSearchStudies()}
            placeholder="Ex: creatina monohidratada e ganho de força"
            disabled={searchStudies.isPending}
          />
          <Button
            onClick={handleSearchStudies}
            disabled={searchStudies.isPending}
            className="gap-1 shrink-0"
          >
            {searchStudies.isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Search size={14} />
            )}
            {searchStudies.isPending ? "Buscando..." : "Buscar estudos"}
          </Button>
        </div>

        {studies.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              {studies.length} sugestões para: <span className="text-foreground">{searchedTopic}</span>
            </p>
            {studies.map((s, idx) => (
              <Card key={idx} className="p-3 border-border/50 bg-background/40">
                <div className="flex items-start gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {s.angle}
                  </Badge>
                  {s.study_year && (
                    <Badge variant="secondary" className="text-[10px]">
                      {s.study_year}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground leading-snug mb-1">
                  {s.study_title}
                </p>
                {s.study_authors && (
                  <p className="text-xs text-muted-foreground mb-1">{s.study_authors}</p>
                )}
                <p className="text-xs text-muted-foreground mb-2">{s.short_pitch}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <a
                    href={s.study_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 truncate max-w-[60%]"
                  >
                    <ExternalLink size={11} className="shrink-0" />
                    <span className="truncate">{s.study_url}</span>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => handleExpandStudy(s, idx)}
                    disabled={expandStudy.isPending}
                    className="gap-1 h-7 text-xs"
                  >
                    {expandingIdx === idx ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    Gerar artigo
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
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

            {draft.ai_generated && draft.source_url && (
              <div className="text-xs bg-primary/10 p-2 rounded border border-primary/30 flex items-start gap-2">
                <BookOpen size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-muted-foreground">Estudo de referência (obrigatório):</p>
                  <a
                    href={draft.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate block"
                  >
                    {draft.source_url}
                  </a>
                </div>
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
                <Label>
                  Fonte/estudo (URL) {draft.ai_generated && <span className="text-destructive">*</span>}
                </Label>
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
