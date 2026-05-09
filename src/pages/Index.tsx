import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import heroAthlete from "@/assets/hero-athlete.webp";
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
import { SectionDifference } from "@/components/landing/SectionDifference";
import { SectionFeatures } from "@/components/landing/SectionFeatures";
import { SectionResults } from "@/components/landing/SectionResults";
import { SectionAbout } from "@/components/landing/SectionAbout";
import { SectionPricing } from "@/components/landing/SectionPricing";
import { SectionFAQ } from "@/components/landing/SectionFAQ";
import { Footer } from "@/components/landing/Footer";

const HOW_IT_WORKS = [
  {
    icon: ClipboardList,
    title: "1. Responda o quiz",
    desc: "Mais de 20 perguntas sobre seu corpo, rotina, objetivo e o que você come. O sistema usa essas respostas pra estruturar tudo. Sem julgamento. Sem complicação.",
  },
  {
    icon: Camera,
    title: "2. Leitura corporal por IA",
    desc: "4 fotos processadas em segundos. O sistema estima composição corporal e define as prioridades.",
  },
  {
    icon: Rocket,
    title: "3. Sua estrutura ativa",
    desc: "Treino, organização alimentar e progresso reunidos em um só sistema para você ter uma direção clara.",
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
          {...({ fetchpriority: "high" } as any)}
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
            <img src={logo} alt="EVORIA" className="w-16 h-16 mb-6" />
          </div>
<p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-primary mb-5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5">
            <Sparkles size={12} /> MÉTODO FRANZEN • ESTRUTURADO EM SISTEMA
          </p>
          <h1 className="md:text-7xl font-heading font-bold text-foreground mb-5 leading-[1.05] tracking-tight text-2xl">
            Você treina há tempo.<br />
            O problema nunca foi o esforço. <br className="hidden md:block" />
            <span className="text-gradient">Foi a falta de estrutura.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl md:max-w-2xl">
            A lógica por trás da metodologia que aplico há anos, agora organizada em uma experiência mais prática, acessível e autônoma.<br />
            Com entrega antes do teu próximo treino.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
            <Link to={ctaPrimaryTo}>
              <Button size="lg" className="glow gap-2 h-14 px-8 text-base w-full sm:w-auto">
                Começar agora <ArrowRight size={18} />
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
              <CheckCircle2 size={14} className="text-primary" /> Quiz de 5 a 8 minutos. Estrutura pronta hoje.
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> Você entende a estrutura antes de liberar o acesso completo.
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> Organização alimentar com alimentos da sua rotina.
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" /> 7 dias de garantia. Cancela quando quiser.
            </span>
          </div>
        </div>
      </section>

      {/* Faixa de oferta */}
      <section className="border-t border-border bg-primary/5">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-2">
            LANÇAMENTO • PRIMEIROS USUÁRIOS
          </p>
          <p className="text-lg md:text-2xl font-heading font-bold text-foreground leading-snug">
            Menos de R$1 por dia no primeiro mês.
          </p>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            R$29,90 hoje. Cancela quando quiser.
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Como funciona</p>
          <h2 className="md:text-5xl font-heading font-bold text-foreground leading-tight text-2xl">
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

      <SectionDifference />
      <SectionGoals />
      <SectionFeatures />
      <SectionResults />
      <SectionAbout />
      <SectionPricing />
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
            Faça o quiz, entenda sua estrutura inicial e decida se a EVORIA faz sentido para você.
          </p>
          <Link to={ctaPrimaryTo}>
            <Button size="lg" className="glow gap-2 h-14 px-10 text-base">
              Começar agora <ArrowRight size={18} />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-5">
            ✓ Tempo estimado: 5 a 8 minutos <br />
            ✓ Você entende a estrutura antes de liberar o acesso <br />
            ✓ Cancela quando quiser
          </p>
        </div>
      </section>

      {/* Disclaimer Legal */}
      <section className="border-t border-border bg-card/20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-[10px] leading-relaxed text-muted-foreground/60 text-justify">
            A EVORIA é uma plataforma digital de organização de rotina física, alimentar e acompanhamento de progresso baseada nas informações fornecidas pelo usuário. O uso da plataforma não substitui acompanhamento individual de médico, nutricionista, profissional de educação física ou outro profissional habilitado, especialmente em condições clínicas, lesões, restrições específicas ou objetivos que exijam supervisão profissional. As leituras visuais por foto são estimativas computacionais e não constituem diagnóstico, avaliação clínica ou laudo profissional. Resultados variam conforme adesão, rotina, individualidade e execução.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
