import { Card } from "@/components/ui/card";
import { Flame, Dumbbell, Zap } from "lucide-react";

const GOALS = [
  {
    icon: Dumbbell,
    title: "Hipertrofia",
    desc: "Ganhe massa magra com volume, intensidade e recuperação calculados pra você. Sem chutar série e repetição.",
    tag: "Ganho de massa",
  },
  {
    icon: Flame,
    title: "Emagrecimento",
    desc: "Perca gordura sem perder músculo. Déficit calórico inteligente, treino que preserva força, dieta que cabe na rotina.",
    tag: "Definição",
  },
  {
    icon: Zap,
    title: "Performance",
    desc: "Mais força, mais resistência, mais explosão. Periodização pra quem treina pra render em outros esportes, e não só pra estética.",
    tag: "Condicionamento",
  },
];

export const SectionGoals = () => (
  <section className="max-w-5xl mx-auto px-4 py-20">
    <div className="text-center mb-12">
      <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Pra qualquer objetivo</p>
      <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
        Um protocolo. <span className="text-gradient">Três caminhos.</span>
      </h2>
      <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
        Você diz onde quer chegar. A metodologia monta o caminho mais curto.
      </p>
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
