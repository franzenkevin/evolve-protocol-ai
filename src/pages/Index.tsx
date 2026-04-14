import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import { ArrowRight, Dumbbell, UtensilsCrossed, TrendingUp, Shield } from "lucide-react";

const FEATURES = [
  { icon: Dumbbell, title: "Treino Personalizado", desc: "Protocolo gerado pela sua metodologia + IA" },
  { icon: UtensilsCrossed, title: "Dieta Inteligente", desc: "Macros calculados e substituições automáticas" },
  { icon: TrendingUp, title: "Progressão Contínua", desc: "Revisão a cada 60 dias com análise de evolução" },
  { icon: Shield, title: "Segurança Primeiro", desc: "Regras do profissional sempre acima da IA" },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" width={1920} height={1080} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative z-10 text-center px-4 animate-fade-in max-w-2xl">
          <img src={logo} alt="Hypertrophy" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-4">
            Hyper<span className="text-gradient">trophy</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Consultoria fitness personalizada com inteligência artificial e sua metodologia no controle.
          </p>
          <div className="flex gap-3 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="glow gap-2">
                  Dashboard <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" className="glow gap-2">
                    Entrar <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="lg" variant="outline">Criar conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-10">
          Tudo que você precisa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl card-gradient border border-border animate-slide-up">
              <Icon size={28} className="text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
