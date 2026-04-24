import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";
import {
  ArrowRight,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  Brain,
  ShieldCheck,
  Camera,
  ClipboardList,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "Responda o quiz",
    desc: "5 a 8 minutos. Conta seus objetivos, rotina e preferências.",
  },
  {
    icon: Camera,
    title: "Avaliação por foto com IA",
    desc: "Análise de composição corporal, postura e pontos a desenvolver.",
  },
  {
    icon: Sparkles,
    title: "Receba seu protocolo",
    desc: "Treino e dieta personalizados, prontos para os próximos 60 dias.",
  },
];

const FEATURES = [
  { icon: Dumbbell, title: "Treino sob medida", desc: "Divisão, exercícios e progressão calculados pela metodologia." },
  { icon: UtensilsCrossed, title: "Dieta inteligente", desc: "Macros e refeições com os alimentos que você gosta." },
  { icon: Brain, title: "Coach IA 24/7", desc: "Tira dúvidas e ajusta no detalhe quando você precisar." },
  { icon: TrendingUp, title: "Revisão a cada 60 dias", desc: "Seu protocolo evolui junto com seu progresso." },
];

const PROOF = [
  { label: "Metodologia validada", desc: "Base científica + treinador profissional" },
  { label: "IA + supervisão humana", desc: "Regras do profissional sempre acima da IA" },
  { label: "Sem mensalidade no quiz", desc: "Pague só quando liberar seu protocolo" },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Auto-redirect logged-in users to where they belong
  useEffect(() => {
    if (authLoading || !user) return;
    if (adminLoading || profileLoading || subLoading) return;

    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    const isActive =
      subscription &&
      ["active", "trialing"].includes(subscription.status) &&
      (!subscription.current_period_end ||
        new Date(subscription.current_period_end) > new Date());

    if (!profile?.onboarding_complete) {
      navigate("/welcome", { replace: true });
    } else if (!isActive) {
      navigate("/plans", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, profile, profileLoading, subscription, subLoading, isAdmin, adminLoading, navigate]);

  const ctaPrimary = user ? "Continuar" : "Iniciar protocolo completo";
  const ctaPrimaryTo = user ? "/welcome" : "/signup";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative z-10 text-center px-4 animate-fade-in max-w-2xl">
          <img src={logo} alt="Hypertrophy" className="w-20 h-20 mx-auto mb-5" />
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary mb-4 px-3 py-1 rounded-full border border-primary/30 bg-primary/5">
            <Sparkles size={12} /> Consultoria fitness com IA
          </p>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-4 leading-tight">
            Seu protocolo de hipertrofia <span className="text-gradient">personalizado</span> em 8 minutos
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Treino e dieta calculados pela sua metodologia, ajustados a cada 60 dias. Sem coach genérico, sem PDF
            estático.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ctaPrimaryTo}>
              <Button size="lg" className="glow gap-2 h-14 px-8 text-base w-full sm:w-auto">
                {ctaPrimary} <ArrowRight size={18} />
              </Button>
            </Link>
            {!user && (
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            ✓ Sem cobrança no quiz · ✓ Pague só ao liberar o protocolo
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Como funciona</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            3 passos até seu protocolo
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
            <Card key={title} className="p-6 card-gradient border-border relative">
              <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
                {i + 1}
              </span>
              <Icon size={26} className="text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* O que você recebe */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-border">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">O que você recebe</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            Tudo que precisa, no mesmo lugar
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6 card-gradient border-border">
              <Icon size={28} className="text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Prova social leve */}
      <section className="max-w-4xl mx-auto px-4 py-12 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROOF.map((p) => (
            <div
              key={p.label}
              className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5"
            >
              <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle2 size={36} className="text-primary mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
          Pronto pra começar?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Crie sua conta, responda o quiz e veja seu protocolo. Você só paga quando decidir liberar.
        </p>
        <Link to={ctaPrimaryTo}>
          <Button size="lg" className="glow gap-2 h-14 px-8 text-base">
            {ctaPrimary} <ArrowRight size={18} />
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground mt-4">Tempo estimado: 5 a 8 minutos</p>
      </section>
    </div>
  );
};

export default Index;
