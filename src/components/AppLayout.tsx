import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, UtensilsCrossed, TrendingUp, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/training", icon: Dumbbell, label: "Treino" },
  { to: "/diet", icon: UtensilsCrossed, label: "Dieta" },
  { to: "/progress", icon: TrendingUp, label: "Progresso" },
  { to: "/profile", icon: User, label: "Perfil" },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-auto pb-20">{children}</main>

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
    </div>
  );
};

export default AppLayout;
