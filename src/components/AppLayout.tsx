import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, UtensilsCrossed, TrendingUp, Menu } from "lucide-react";
import AppSidebar from "@/components/sidebar/AppSidebar";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/training", icon: Dumbbell, label: "Treino" },
  { to: "/diet", icon: UtensilsCrossed, label: "Dieta" },
  { to: "/progress", icon: TrendingUp, label: "Progresso" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header with menu trigger */}
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-heading font-semibold text-foreground">Hypertrophy</span>
          <div className="w-9" /> {/* spacer */}
        </div>
      </header>

      <main className="flex-1 overflow-auto pb-20">{children}</main>

      {/* Bottom nav - 4 items only */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
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
