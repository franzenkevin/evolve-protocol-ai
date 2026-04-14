import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Shield, FileText, HelpCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name || "Atleta";
  const email = user?.email || "";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const MENU_ITEMS = [
    { icon: Settings, label: "Editar perfil", onClick: () => {} },
    { icon: FileText, label: "Meu protocolo", onClick: () => navigate("/training") },
    { icon: Shield, label: "Privacidade", onClick: () => {} },
    { icon: HelpCircle, label: "Ajuda", onClick: () => {} },
  ];

  return (
    <AppLayout>
      <div className="p-4 max-w-lg mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold text-foreground pt-2">Perfil</h1>

        {/* Profile Card */}
        <Card className="p-5 card-gradient border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <img src={logo} alt="Avatar" className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{email}</p>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">Plano Ativo</span>
          </div>
        </Card>

        {/* Stats */}
        <Card className="p-4 card-gradient border-border">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Protocolos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">15</p>
              <p className="text-xs text-muted-foreground">Dias ativos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-primary">78%</p>
              <p className="text-xs text-muted-foreground">Aderência</p>
            </div>
          </div>
        </Card>

        {/* Menu */}
        <div className="space-y-1">
          {MENU_ITEMS.map(({ icon: Icon, label, onClick }) => (
            <Card key={label} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors" onClick={onClick}>
              <Icon size={18} className="text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{label}</span>
            </Card>
          ))}
        </div>

        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" />
          Sair
        </Button>
      </div>
    </AppLayout>
  );
};

export default Profile;
