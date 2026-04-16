import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useExercises, useCreateExercise, useDeleteExercise } from "@/hooks/useExercises";
import { useFoods, useCreateFood, useDeleteFood } from "@/hooks/useFoods";
import { useJournalArticles, useCreateJournalArticle, useDeleteJournalArticle } from "@/hooks/useJournal";
import { Users, Dumbbell, UtensilsCrossed, Settings, LogOut, LayoutDashboard, ArrowLeft, Plus, Trash2, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [search, setSearch] = useState("");
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

  // Exercise form
  const [exName, setExName] = useState("");
  const [exCategory, setExCategory] = useState("");
  const [exEquipment, setExEquipment] = useState("");
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

  const handleAddExercise = async () => {
    if (!exName || !exCategory) return;
    try {
      await createExercise.mutateAsync({ name: exName, category: exCategory, equipment: exEquipment || null, video_url: null, instructions: null });
      toast({ title: "Exercício adicionado!" });
      setExName(""); setExCategory(""); setExEquipment(""); setExDialogOpen(false);
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
      });
      toast({ title: "Alimento adicionado!" });
      setFoodName(""); setFoodProtein(""); setFoodCarbs(""); setFoodFat(""); setFoodCal(""); setFoodDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft size={18} /></Button>
            <h1 className="text-xl font-heading font-bold text-foreground">Painel Admin</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2"><LogOut size={14} />Sair</Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: "Clientes", value: "—", color: "text-primary" },
            { icon: Dumbbell, label: "Exercícios", value: String(exercises.length), color: "text-info" },
            { icon: UtensilsCrossed, label: "Alimentos", value: String(foods.length), color: "text-warning" },
            { icon: Newspaper, label: "Artigos", value: String(articles.length), color: "text-success" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="p-4 card-gradient border-border">
              <Icon size={20} className={color} />
              <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="exercises">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="exercises" className="gap-1"><Dumbbell size={14} />Exercícios</TabsTrigger>
            <TabsTrigger value="foods" className="gap-1"><UtensilsCrossed size={14} />Alimentos</TabsTrigger>
            <TabsTrigger value="journal" className="gap-1"><Newspaper size={14} />Journal</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings size={14} />Config</TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{exercises.length} exercícios cadastrados</p>
              <Dialog open={exDialogOpen} onOpenChange={setExDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus size={14} />Adicionar</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Exercício</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Nome</Label><Input value={exName} onChange={(e) => setExName(e.target.value)} className="mt-1" /></div>
                    <div><Label>Categoria</Label><Input value={exCategory} onChange={(e) => setExCategory(e.target.value)} placeholder="Ex: Peito, Costas..." className="mt-1" /></div>
                    <div><Label>Equipamento</Label><Input value={exEquipment} onChange={(e) => setExEquipment(e.target.value)} placeholder="Ex: Barra, Halteres..." className="mt-1" /></div>
                    <Button onClick={handleAddExercise} className="w-full" disabled={createExercise.isPending}>
                      {createExercise.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {exercises.map((ex) => (
              <Card key={ex.id} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.category}{ex.equipment ? ` • ${ex.equipment}` : ""}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteExercise.mutate(ex.id)}>
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

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Regras da Metodologia</h3>
              <p className="text-sm text-muted-foreground">Configure as regras de treino, dieta, progressão e revisão do protocolo.</p>
              <Button variant="outline" size="sm" className="mt-3">Configurar</Button>
            </Card>
            <Card className="p-4 card-gradient border-border">
              <h3 className="font-heading font-semibold text-foreground mb-2">Protocolo de 60 dias</h3>
              <p className="text-sm text-muted-foreground">Defina ciclo, critérios de troca e regras de revisão automática.</p>
              <Button variant="outline" size="sm" className="mt-3">Configurar</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
