import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, UtensilsCrossed, TrendingUp, FlaskConical, Menu } from "lucide-react";
import AppSidebar from "@/components/sidebar/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import logo from "@/assets/logo.png";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/training", icon: Dumbbell, label: "Treino" },
  { to: "/diet", icon: UtensilsCrossed, label: "Dieta" },
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header with menu trigger + avatar */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={20} />
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">{initials}</span>
            </div>
          </button>
          <span className="text-sm font-heading font-semibold text-foreground">Hypertrophy</span>
          <div className="w-14" /> {/* spacer to balance */}
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom nav - 5 items */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{label}</span>
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
