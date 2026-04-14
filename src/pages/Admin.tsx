import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Dumbbell, UtensilsCrossed, Settings, Search, LogOut, LayoutDashboard, ArrowLeft } from "lucide-react";

const MOCK_CLIENTS = [
  { id: "1", name: "João Silva", goal: "Hipertrofia", adherence: 92, daysLeft: 30, status: "active" },
  { id: "2", name: "Maria Santos", goal: "Emagrecimento", adherence: 65, daysLeft: 8, status: "active" },
  { id: "3", name: "Pedro Costa", goal: "Recomposição", adherence: 45, daysLeft: 45, status: "warning" },
  { id: "4", name: "Ana Oliveira", goal: "Hipertrofia", adherence: 88, daysLeft: 55, status: "active" },
];

const MOCK_EXERCISES = [
  { name: "Supino reto", category: "Peito", equipment: "Barra" },
  { name: "Agachamento livre", category: "Pernas", equipment: "Barra" },
  { name: "Puxada frontal", category: "Costas", equipment: "Máquina" },
  { name: "Desenvolvimento", category: "Ombros", equipment: "Halteres" },
  { name: "Rosca direta", category: "Bíceps", equipment: "Barra" },
  { name: "Tríceps pulley", category: "Tríceps", equipment: "Cabo" },
];

const MOCK_FOODS = [
  { name: "Frango", protein: 23, carbs: 0, fat: 3, cal: 120 },
  { name: "Arroz branco", protein: 3, carbs: 28, fat: 0, cal: 130 },
  { name: "Batata doce", protein: 1, carbs: 20, fat: 0, cal: 86 },
  { name: "Ovos", protein: 6, carbs: 1, fat: 5, cal: 70 },
  { name: "Whey Protein", protein: 25, carbs: 3, fat: 1, cal: 120 },
  { name: "Aveia", protein: 5, carbs: 28, fat: 3, cal: 150 },
];

const Admin = () => {
  const [search, setSearch] = useState("");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-xl font-heading font-bold text-foreground">Painel Admin</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut size={14} />Sair
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Users, label: "Clientes", value: "4", color: "text-primary" },
            { icon: Dumbbell, label: "Exercícios", value: "48", color: "text-info" },
            { icon: UtensilsCrossed, label: "Alimentos", value: "120", color: "text-warning" },
            { icon: LayoutDashboard, label: "Protocolos", value: "6", color: "text-success" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="p-4 card-gradient border-border">
              <Icon size={20} className={color} />
              <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="clients">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="clients" className="gap-1"><Users size={14} />Clientes</TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1"><Dumbbell size={14} />Exercícios</TabsTrigger>
            <TabsTrigger value="foods" className="gap-1"><UtensilsCrossed size={14} />Alimentos</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings size={14} />Config</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            {MOCK_CLIENTS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).map((client) => (
              <Card key={client.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.goal} • {client.daysLeft} dias restantes</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={client.adherence >= 70 ? "default" : "destructive"}>
                    {client.adherence}%
                  </Badge>
                  <Button variant="outline" size="sm">Ver</Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="exercises" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{MOCK_EXERCISES.length} exercícios cadastrados</p>
              <Button size="sm">Adicionar</Button>
            </div>
            {MOCK_EXERCISES.map((ex, i) => (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.category} • {ex.equipment}</p>
                </div>
                <Button variant="ghost" size="sm">Editar</Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="foods" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{MOCK_FOODS.length} alimentos cadastrados</p>
              <Button size="sm">Adicionar</Button>
            </div>
            {MOCK_FOODS.map((food, i) => (
              <Card key={i} className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{food.name}</p>
                  <p className="text-xs text-muted-foreground">P:{food.protein}g C:{food.carbs}g G:{food.fat}g • {food.cal}kcal</p>
                </div>
                <Button variant="ghost" size="sm">Editar</Button>
              </Card>
            ))}
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
