import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import heroAthlete from "@/assets/hero-athlete.jpg";
import logo from "@/assets/logo.png";
import {
  ArrowRight,
  Sparkles,
  ClipboardList,
  Camera,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { SectionGoals } from "@/components/landing/SectionGoals";
import { SectionFeatures } from "@/components/landing/SectionFeatures";
import { SectionResults } from "@/components/landing/SectionResults";
import { SectionAbout } from "@/components/landing/SectionAbout";
import { SectionFAQ } from "@/components/landing/SectionFAQ";
import { Footer } from "@/components/landing/Footer";

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "1. Responda o quiz",
    desc: "5 a 8 minutos. Conta seu objetivo, rotina, equipamento e o que você gosta de comer.",
  },
  {
    icon: Camera,
    title: "2. Avaliação por foto IA",
    desc: "4 fotos analisadas em segundos: composição corporal, postura e prioridades.",
  },
  {
    icon: Rocket,
    title: "3. Receba seu protocolo",
    desc: "Treino e dieta calculados pra seu objetivo, prontos pra começar hoje.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

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

  const ctaPrimary = user ? "Continuar protocolo" : "Começar agora";
  const ctaPrimaryTo = user ? "/welcome" : "/signup";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        <img
          src={heroAthlete}
          alt="Atleta treinando em academia"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          width={1920}
          height={1080}
          fetchPriority="high"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(var(--background) / 0.7) 0%, hsl(var(--background) / 0.85) 60%, hsl(var(--background)) 100%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-24 text-center md:text-left animate-fade-in">
          <div className="flex md:justify-start justify-center">
            <img src={logo} alt="Hypertrophy" className="w-16 h-16 mb-6" />
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary mb-5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5">
            <Sparkles size={12} /> Consultoria fitness com IA
          </p>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-foreground mb-5 leading-[1.05] tracking-tight">
            O corpo que você quer <br className="hidden md:block" />
            <span className="text-gradient">não nasce no chute.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl md:max-w-2xl">
            Pare de copiar treino do YouTube e dieta do amigo. Receba um protocolo de treino e
            alimentação <strong className="text-foreground">100% personalizado</strong> pro seu objetivo,
            corpo e rotina — calculado pela metodologia, ajustado a cada 60 dias.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
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
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 justify-center md:justify-start text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> Quiz gratuito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> Avaliação por IA inclusa
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> Cancele quando quiser
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> Teste 7 dias grátis
            </span>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Como funciona</p>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
            Do quiz ao protocolo <br />
            <span className="text-gradient">em menos de 10 minutos.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6 card-gradient border-border">
              <Icon size={28} className="text-primary mb-4" />
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <SectionGoals />
      <SectionFeatures />
      <SectionResults />
      <SectionAbout />
      <SectionFAQ />

      {/* CTA final */}
      <section className="relative py-24 border-t border-border overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{ background: "var(--gradient-glow)" }}
        />
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Sparkles size={32} className="text-primary mx-auto mb-4" />
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-5 leading-tight">
            Seu próximo eu <br />
            <span className="text-gradient">já te espera.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Pare de adiar. Faça o quiz, veja seu protocolo e decida se vale a pena. Você não paga
            nada pra descobrir.
          </p>
          <Link to={ctaPrimaryTo}>
            <Button size="lg" className="glow gap-2 h-14 px-10 text-base">
              {ctaPrimary} <ArrowRight size={18} />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-5">
            ✓ Tempo estimado: 5 a 8 minutos · ✓ Pague só ao liberar o protocolo
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
