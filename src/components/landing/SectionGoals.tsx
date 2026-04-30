import { Card } from "@/components/ui/card";
import { Flame, Dumbbell, Zap } from "lucide-react";

const GOALS = [
  {
    icon: Dumbbell,
    title: "Hipertrofia",
    desc: "Periodização pra quem quer render mais dentro e fora da academia. Mais força, mais resistência e saúde.",
    tag: "GANHO DE MASSA",
  },
  {
    icon: Flame,
    title: "Emagrecimento",
    desc: "Déficit calórico inteligente. Programa de treino que preserva músculo. Organização alimentar que cabe na sua rotina sem te deixar com fome o dia todo.",
    tag: "DEFINIÇÃO",
  },
  {
    icon: Zap,
    title: "Recomposição",
    desc: "Periodização pra quem quer render mais — dentro e fora da academia. Mais força, mais resistência, mais explosão.",
    tag: "SAÚDE GERAL",
  },
];

export const SectionGoals = () => (
  <section className="max-w-5xl mx-auto px-4 py-20">
    <div className="text-center mb-12">
      <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Protocolo completo</p>
      <h2 className="md:text-5xl font-heading font-bold text-foreground leading-tight text-2xl">
        Você diz onde quer chegar. <br />
        <span className="text-gradient">O sistema traça o caminho mais curto.</span>
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {GOALS.map(({ icon: Icon, title, desc, tag }) => (
        <Card key={title} className="p-6 card-gradient border-border hover:border-primary/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="text-primary" size={24} />
          </div>
          <p className="text-[10px] font-semibold tracking-wider uppercase text-primary/80 mb-1">{tag}</p>
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </Card>
      ))}
    </div>
  </section>
);
