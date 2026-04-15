import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const SidebarHeader = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const name = profile?.full_name || user?.user_metadata?.full_name || "Atleta";
  const email = user?.email || "";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <img src={logo} alt="Avatar" className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-foreground text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 text-muted-foreground hover:text-destructive">
          <LogOut size={18} />
        </Button>
      </div>
    </div>
  );
};

export default SidebarHeader;
