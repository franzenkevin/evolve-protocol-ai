import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useExercises, useCreateExercise, useDeleteExercise } from "@/hooks/useExercises";
import { useFoods, useCreateFood, useDeleteFood } from "@/hooks/useFoods";
import { useJournalArticles, useCreateJournalArticle, useDeleteJournalArticle } from "@/hooks/useJournal";
import { LogOut, ArrowLeft, Plus, Trash2, Newspaper, Dumbbell, UtensilsCrossed, Settings, BarChart3, CreditCard, Calendar, UserCog, Megaphone, ScrollText, Video, Tag, DollarSign, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLogAudit } from "@/hooks/useAuditLog";
import VideoUploader from "@/components/admin/VideoUploader";
import AdminMetrics from "@/components/admin/AdminMetrics";
import AdminSales from "@/components/admin/AdminSales";
import AdminRenewals from "@/components/admin/AdminRenewals";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminMeetings from "@/components/admin/AdminMeetings";
import AdminPlans from "@/components/admin/AdminPlans";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminRefunds from "@/components/admin/AdminRefunds";

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: exercises = [], isLoading: loadingEx } = useExercises();
  const { data: foods = [], isLoading: loadingFoods } = useFoods();
  const { data: articles = [], isLoading: loadingArticles } = useJournalArticles();
  const createExercise = useCreateExercise();
  const deleteExercise = useDeleteExercise();
  const createFood = useCreateFood();
  const deleteFood = useDeleteFood();
  const createArticle = useCreateJournalArticle();
  const deleteArticle = useDeleteJournalArticle();
  const logAudit = useLogAudit();
  const [deletingArticle, setDeletingArticle] = useState<{ id: string; title: string } | null>(null);

  // Exercise form
  const [exName, setExName] = useState("");
  const [exCategory, setExCategory] = useState("");
  const [exEquipment, setExEquipment] = useState("");
  const [exVideoUrl, setExVideoUrl] = useState<string | null>(null);
  const [exInstructions, setExInstructions] = useState("");
  const [exDialogOpen, setExDialogOpen] = useState(false);

  // Food form
  const [foodName, setFoodName] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [foodCal, setFoodCal] = useState("");
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);

  // Journal form
  const [artTitle, setArtTitle] = useState("");
  const [artCategory, setArtCategory] = useState("");
  const [artExcerpt, setArtExcerpt] = useState("");
  const [artContent, setArtContent] = useState("");
  const [artImageUrl, setArtImageUrl] = useState("");
  const [artSourceUrl, setArtSourceUrl] = useState("");
  const [artTags, setArtTags] = useState("");
  const [artReadTime, setArtReadTime] = useState("3");
  const [artDialogOpen, setArtDialogOpen] = useState(false);

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const handleAddExercise = async () => {
    if (!exName || !exCategory) return;
    try {
      await createExercise.mutateAsync({
        name: exName,
        category: exCategory,
        equipment: exEquipment || null,
        video_url: exVideoUrl,
        instructions: exInstructions || null,
      });
      toast({ title: "Exercício adicionado!" });
      setExName(""); setExCategory(""); setExEquipment(""); setExVideoUrl(null); setExInstructions(""); setExDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleAddFood = async () => {
    if (!foodName) return;
    try {
      await createFood.mutateAsync({
        name: foodName,
        protein: parseFloat(foodProtein) || 0,
        carbs: parseFloat(foodCarbs) || 0,
        fat: parseFloat(foodFat) || 0,
        calories: parseFloat(foodCal) || 0,
        category: null,
        fiber: 0,
        portion_grams: 100,
        source: "manual",
      });
      toast({ title: "Alimento adicionado!" });
      setFoodName(""); setFoodProtein(""); setFoodCarbs(""); setFoodFat(""); setFoodCal(""); setFoodDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleAddArticle = async () => {
    if (!artTitle || !artContent) {
      toast({ title: "Preencha título e conteúdo", variant: "destructive" });
      return;
    }
    try {
      const tags = artTags.split(",").map((t) => t.trim()).filter(Boolean);
      await createArticle.mutateAsync({
        title: artTitle,
        summary: artExcerpt || artContent.slice(0, 200),
        excerpt: artExcerpt || undefined,
        content: artContent,
        category: artCategory || "fitness",
        image_url: artImageUrl || undefined,
        source_url: artSourceUrl || undefined,
        tags: tags.length ? tags : undefined,
        read_time_minutes: parseInt(artReadTime) || 3,
      });
      toast({ title: "Artigo publicado!", description: "Notificação enviada aos usuários." });
      setArtTitle(""); setArtCategory(""); setArtExcerpt(""); setArtContent("");
      setArtImageUrl(""); setArtSourceUrl(""); setArtTags(""); setArtReadTime("3");
      setArtDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft size={18} /></Button>
            <h1 className="text-xl font-heading font-bold text-foreground">Painel do Criador</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2"><LogOut size={14} />Sair</Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 size={14} />Visão geral</TabsTrigger>
            <TabsTrigger value="sales" className="gap-1"><CreditCard size={14} />Vendas</TabsTrigger>
            <TabsTrigger value="renewals" className="gap-1"><Calendar size={14} />Renovações</TabsTrigger>
            <TabsTrigger value="refunds" className="gap-1"><Receipt size={14} />Reembolsos</TabsTrigger>
            <TabsTrigger value="leads" className="gap-1"><Megaphone size={14} />Leads</TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1"><Video size={14} />Reuniões</TabsTrigger>
            <TabsTrigger value="plans" className="gap-1"><DollarSign size={14} />Planos</TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1"><Tag size={14} />Cupons</TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1"><Dumbbell size={14} />Exercícios</TabsTrigger>
            <TabsTrigger value="foods" className="gap-1"><UtensilsCrossed size={14} />Alimentos</TabsTrigger>
            <TabsTrigger value="journal" className="gap-1"><Newspaper size={14} />Journal</TabsTrigger>
            <TabsTrigger value="users" className="gap-1"><UserCog size={14} />Usuários</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1"><ScrollText size={14} />Auditoria</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings size={14} />Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4"><AdminMetrics /></TabsContent>
          <TabsContent value="sales" className="mt-4"><AdminSales /></TabsContent>
          <TabsContent value="renewals" className="mt-4"><AdminRenewals /></TabsContent>
          <TabsContent value="refunds" className="mt-4"><AdminRefunds /></TabsContent>
          <TabsContent value="leads" className="mt-4"><AdminLeads /></TabsContent>
          <TabsContent value="meetings" className="mt-4"><AdminMeetings /></TabsContent>
          <TabsContent value="plans" className="mt-4"><AdminPlans /></TabsContent>
          <TabsContent value="coupons" className="mt-4"><AdminCoupons /></TabsContent>
          <TabsContent value="users" className="mt-4"><AdminUsers /></TabsContent>
          <TabsContent value="audit" className="mt-4"><AdminAuditLog /></TabsContent>

          <TabsContent value="exercises" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{exercises.length} exercícios cadastrados</p>
              <Dialog open={exDialogOpen} onOpenChange={setExDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />Adicionar</Button></DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Novo Exercício</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={exName} onChange={(e) => setExName(e.target.value)} className="mt-1" /></div>
                    <div><Label>Categoria</Label><Input value={exCategory} onChange={(e) => setExCategory(e.target.value)} placeholder="Ex: Peito, Costas..." className="mt-1" /></div>
                    <div><Label>Equipamento</Label><Input value={exEquipment} onChange={(e) => setExEquipment(e.target.value)} placeholder="Ex: Barra, Halteres..." className="mt-1" /></div>
                    <VideoUploader value={exVideoUrl} onChange={setExVideoUrl} />
                    <div>
                      <Label>Instruções</Label>
                      <Textarea value={exInstructions} onChange={(e) => setExInstructions(e.target.value)} placeholder="Como executar..." className="mt-1 h-20 resize-none" />
                    </div>
                    <Button onClick={handleAddExercise} className="w-full" disabled={createExercise.isPending}>
                      {createExercise.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {exercises.map((ex) => (
              <Card key={ex.id} className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{ex.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ex.category}{ex.equipment ? ` • ${ex.equipment}` : ""}{ex.video_url ? " • 🎥" : ""}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => deleteExercise.mutate(ex.id)}>
                  <Trash2 size={14} />
                </Button>
              </Card>
            ))}
            {!loadingEx && exercises.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum exercício cadastrado.</p>}
          </TabsContent>

          <TabsContent value="foods" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{foods.length} alimentos cadastrados</p>
              <Dialog open={foodDialogOpen} onOpenChange={setFoodDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />Adicionar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Alimento</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={foodName} onChange={(e) => setFoodName(e.target.value)} className="mt-1" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Proteína (g)</Label><Input type="number" value={foodProtein} onChange={(e) => setFoodProtein(e.target.value)} className="mt-1" /></div>
                      <div><Label>Carbs (g)</Label><Input type="number" value={foodCarbs} onChange={(e) => setFoodCarbs(e.target.value)} className="mt-1" /></div>
                      <div><Label>Gordura (g)</Label><Input type="number" value={foodFat} onChange={(e) => setFoodFat(e.target.value)} className="mt-1" /></div>
                      <div><Label>Calorias</Label><Input type="number" value={foodCal} onChange={(e) => setFoodCal(e.target.value)} className="mt-1" /></div>
                    </div>
                    <Button onClick={handleAddFood} className="w-full" disabled={createFood.isPending}>
                      {createFood.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {foods.map((food) => (
              <Card key={food.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{food.name}</p>
                  <p className="text-xs text-muted-foreground">P:{food.protein}g C:{food.carbs}g G:{food.fat}g • {food.calories}kcal</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFood.mutate(food.id)}>
                  <Trash2 size={14} />
                </Button>
              </Card>
            ))}
            {!loadingFoods && foods.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum alimento cadastrado.</p>}
          </TabsContent>

          <TabsContent value="journal" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{articles.length} artigos publicados</p>
              <Dialog open={artDialogOpen} onOpenChange={setArtDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />Novo artigo</Button></DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Publicar no Journal</DialogTitle></DialogHeader>
                  <p className="text-xs text-muted-foreground -mt-2">📲 Os usuários receberão uma notificação push automaticamente.</p>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label>Título *</Label>
                      <Input value={artTitle} onChange={(e) => setArtTitle(e.target.value)} placeholder="Ex: Novo estudo sobre creatina" className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Categoria</Label>
                        <Input value={artCategory} onChange={(e) => setArtCategory(e.target.value)} placeholder="fitness, ciência..." className="mt-1" />
                      </div>
                      <div>
                        <Label>Tempo de leitura (min)</Label>
                        <Input type="number" value={artReadTime} onChange={(e) => setArtReadTime(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label>Resumo / Chamada</Label>
                      <Textarea value={artExcerpt} onChange={(e) => setArtExcerpt(e.target.value)} placeholder="Breve resumo que aparece na lista" className="mt-1 h-16 resize-none" />
                    </div>
                    <div>
                      <Label>Conteúdo completo *</Label>
                      <Textarea value={artContent} onChange={(e) => setArtContent(e.target.value)} placeholder="Texto completo do artigo" className="mt-1 h-40 resize-none" />
                    </div>
                    <div><Label>URL da imagem de capa</Label><Input value={artImageUrl} onChange={(e) => setArtImageUrl(e.target.value)} placeholder="https://..." className="mt-1" /></div>
                    <div><Label>URL da fonte/estudo</Label><Input value={artSourceUrl} onChange={(e) => setArtSourceUrl(e.target.value)} placeholder="https://..." className="mt-1" /></div>
                    <div><Label>Tags (separadas por vírgula)</Label><Input value={artTags} onChange={(e) => setArtTags(e.target.value)} placeholder="creatina, força" className="mt-1" /></div>
                    <Button onClick={handleAddArticle} className="w-full glow" disabled={createArticle.isPending}>
                      {createArticle.isPending ? "Publicando..." : "📰 Publicar e notificar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {articles.map((art) => (
              <Card key={art.id} className="p-3 flex items-center gap-3">
                {art.image_url && <img src={art.image_url} alt={art.title} className="w-14 h-14 rounded object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground line-clamp-1">{art.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {art.category && <Badge variant="outline" className="text-[9px] py-0">{art.category}</Badge>}
                    <span>{new Date(art.published_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => setDeletingArticle({ id: art.id, title: art.title })}
                >
                  <Trash2 size={14} />
                </Button>
              </Card>
            ))}
            {!loadingArticles && articles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum artigo publicado.</p>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Versão dos Termos</h3>
              <p className="text-sm text-muted-foreground">
                A versão atual está definida em <code className="text-xs bg-muted px-1 rounded">src/lib/terms.ts</code>.
                Para forçar re-aceite de todos os usuários, altere o valor de <code className="text-xs bg-muted px-1 rounded">CURRENT_TERMS_VERSION</code>.
              </p>
            </Card>
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Regras da Metodologia</h3>
              <p className="text-sm text-muted-foreground">
                As regras vivem em <code className="text-xs bg-muted px-1 rounded">.lovable/memory/features/methodology.md</code> e são aplicadas pelo motor de geração de protocolo.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deletingArticle} onOpenChange={(o) => !o && setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deletingArticle?.title}" será removido permanentemente. Esta ação será registrada no log de auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingArticle) return;
                const target = deletingArticle;
                setDeletingArticle(null);
                try {
                  await deleteArticle.mutateAsync(target.id);
                  await logAudit("delete_article", null, { article_id: target.id, title: target.title });
                } catch (e: any) {
                  toast({ title: "Erro", description: e.message, variant: "destructive" });
                }
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
