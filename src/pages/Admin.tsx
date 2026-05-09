import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogOut,
  ArrowLeft,
  Newspaper,
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  CreditCard,
  Calendar,
  UserCog,
  Megaphone,
  ScrollText,
  Video,
  Tag,
  DollarSign,
  Receipt,
  Activity,
  Sparkles,
  ShoppingBag,
  Trophy,
  Target,
  Heart,
  MessageSquare,
} from "lucide-react";
import AdminPurchases from "@/components/admin/AdminPurchases";
import AdminAIHealth from "@/components/admin/AdminAIHealth";
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
import AdminFoods from "@/components/admin/AdminFoods";
import AdminExercises from "@/components/admin/AdminExercises";
import AdminMobility from "@/components/admin/AdminMobility";
import AdminJournal from "@/components/admin/AdminJournal";
import AdminChallenges from "@/components/admin/AdminChallenges";
import AdminRanking from "@/components/admin/AdminRanking";
import AdminProtocolFeedback from "@/components/admin/AdminProtocolFeedback";
import AdminTestimonials from "@/components/admin/AdminTestimonials";

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-xl font-heading font-bold text-foreground">
              Painel do Criador
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut size={14} />
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="overview">
          <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 size={14} />Visão geral</TabsTrigger>
            <TabsTrigger value="ai-health" className="gap-1"><Sparkles size={14} />IA & Saúde</TabsTrigger>
            <TabsTrigger value="sales" className="gap-1"><CreditCard size={14} />Vendas</TabsTrigger>
            <TabsTrigger value="renewals" className="gap-1"><Calendar size={14} />Renovações</TabsTrigger>
            <TabsTrigger value="refunds" className="gap-1"><Receipt size={14} />Reembolsos</TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1"><ShoppingBag size={14} />Compras</TabsTrigger>
            <TabsTrigger value="leads" className="gap-1"><Megaphone size={14} />Leads</TabsTrigger>
            <TabsTrigger value="meetings" className="gap-1"><Video size={14} />Reuniões</TabsTrigger>
            <TabsTrigger value="plans" className="gap-1"><DollarSign size={14} />Planos</TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1"><Tag size={14} />Cupons</TabsTrigger>
            <TabsTrigger value="exercises" className="gap-1"><Dumbbell size={14} />Exercícios</TabsTrigger>
            <TabsTrigger value="mobility" className="gap-1"><Activity size={14} />Mobilidades</TabsTrigger>
            <TabsTrigger value="foods" className="gap-1"><UtensilsCrossed size={14} />Alimentos</TabsTrigger>
            <TabsTrigger value="journal" className="gap-1"><Newspaper size={14} />Journal</TabsTrigger>
            <TabsTrigger value="users" className="gap-1"><UserCog size={14} />Usuários</TabsTrigger>
            <TabsTrigger value="challenges" className="gap-1"><Target size={14} />Desafios</TabsTrigger>
            <TabsTrigger value="ranking" className="gap-1"><Trophy size={14} />Ranking</TabsTrigger>
            <TabsTrigger value="protocol-feedback" className="gap-1"><Heart size={14} />Feedback Protocolo</TabsTrigger>
            <TabsTrigger value="app-feedback" className="gap-1"><MessageSquare size={14} />Feedback do App</TabsTrigger>
            <TabsTrigger value="audit" className="gap-1"><ScrollText size={14} />Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4"><AdminMetrics /></TabsContent>
          <TabsContent value="ai-health" className="mt-4"><AdminAIHealth /></TabsContent>
          <TabsContent value="sales" className="mt-4"><AdminSales /></TabsContent>
          <TabsContent value="renewals" className="mt-4"><AdminRenewals /></TabsContent>
          <TabsContent value="refunds" className="mt-4"><AdminRefunds /></TabsContent>
          <TabsContent value="purchases" className="mt-4"><AdminPurchases /></TabsContent>
          <TabsContent value="leads" className="mt-4"><AdminLeads /></TabsContent>
          <TabsContent value="meetings" className="mt-4"><AdminMeetings /></TabsContent>
          <TabsContent value="plans" className="mt-4"><AdminPlans /></TabsContent>
          <TabsContent value="coupons" className="mt-4"><AdminCoupons /></TabsContent>
          <TabsContent value="exercises" className="mt-4"><AdminExercises /></TabsContent>
          <TabsContent value="mobility" className="mt-4"><AdminMobility /></TabsContent>
          <TabsContent value="foods" className="mt-4"><AdminFoods /></TabsContent>
          <TabsContent value="journal" className="mt-4"><AdminJournal /></TabsContent>
          <TabsContent value="users" className="mt-4"><AdminUsers /></TabsContent>
          <TabsContent value="challenges" className="mt-4"><AdminChallenges /></TabsContent>
          <TabsContent value="ranking" className="mt-4"><AdminRanking /></TabsContent>
          <TabsContent value="audit" className="mt-4"><AdminAuditLog /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
