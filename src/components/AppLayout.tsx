import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, UtensilsCrossed, MessageCircle, TrendingUp, FlaskConical, Menu } from "lucide-react";
import AppSidebar from "@/components/sidebar/AppSidebar";
import PaymentStatusBanner from "@/components/PaymentStatusBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/training", icon: Dumbbell, label: "Treino" },
  { to: "/diet", icon: UtensilsCrossed, label: "Dieta" },
  { to: "/chat", icon: MessageCircle, label: "Chat IA" },
  { to: "/progress", icon: TrendingUp, label: "Progresso" },
  { to: "/exams", icon: FlaskConical, label: "Exames" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const name = profile?.full_name || user?.user_metadata?.full_name || "";
  const initials = name ? name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "?";
  const avatarUrl = (profile as any)?.avatar_url || "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header with menu trigger + avatar */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={18} />
            <Avatar className="w-7 h-7">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
          </button>
          <span className="text-sm font-heading font-semibold text-foreground">EVORIA</span>
          <div className="w-12" />
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50 safe-area-bottom">
        <div className="grid grid-cols-6 items-center h-16 max-w-lg mx-auto px-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                  active ? "bg-primary/15 scale-110" : ""
                }`}>
                  <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 1.5} />
                </div>
                <span className={`text-[10px] leading-tight font-medium truncate max-w-full ${
                  active ? "opacity-100" : "opacity-70"
                }`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </div>
  );
};

export default AppLayout;
