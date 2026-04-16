import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const SidebarHeader = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const name = profile?.full_name || user?.user_metadata?.full_name || "Atleta";
  const email = user?.email || "";
  const avatarUrl = profile?.avatar_url || "";
  const initials = name ? name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "?";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">{initials}</AvatarFallback>
        </Avatar>
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
