import mockTraining from "@/assets/mockup-training.png";
import mockDiet from "@/assets/mockup-diet.png";
import mockProgress from "@/assets/mockup-progress.png";
import mockAi from "@/assets/mockup-ai.png";

type Feature = {
  eyebrow: string;
  title: string;
  desc: string;
  image: string;
  reverse?: boolean;
};

const FEATURES: Feature[] = [
  {
    eyebrow: "Treino sob medida",
    title: "Cada série calculada pra te levar adiante",
    desc: "Divisão, exercícios, séries, reps, descanso e progressão definidos pela metodologia. Seu treino evolui semana a semana — sem chute, sem cópia.",
    image: mockTraining,
  },
  {
    eyebrow: "Dieta inteligente",
    title: "Macros precisos com a comida que você gosta",
    desc: "Proteína, carbo e gordura no ponto certo do seu objetivo. Refeições montadas com seus alimentos preferidos — porque dieta que você odeia não dura.",
    image: mockDiet,
    reverse: true,
  },
  {
    eyebrow: "Avaliação por foto IA",
    title: "Sua composição corporal lida em segundos",
    desc: "Mande 4 fotos. A IA estima percentual de gordura, identifica desequilíbrios posturais e mapeia pontos fortes e a desenvolver. Tudo entra na receita do seu protocolo.",
    image: mockAi,
  },
  {
    eyebrow: "Progresso medido",
    title: "Você vê o resultado antes do espelho mostrar",
    desc: "Peso, gordura, treinos completados, ranking semanal. Tudo num só lugar — pra manter o foco quando a motivação some.",
    image: mockProgress,
    reverse: true,
  },
];

export const SectionFeatures = () => (
  <section className="py-20 border-t border-border">
    <div className="max-w-5xl mx-auto px-4 mb-16 text-center">
      <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Tudo no app</p>
      <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
        Mais do que um plano. <br />
        <span className="text-gradient">Um sistema completo.</span>
      </h2>
    </div>

    <div className="space-y-24 max-w-6xl mx-auto px-4">
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${
            f.reverse ? "md:[direction:rtl]" : ""
          }`}
        >
          <div className="md:[direction:ltr]">
            <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-3">{f.eyebrow}</p>
            <h3 className="text-2xl md:text-4xl font-heading font-bold text-foreground mb-4 leading-tight">
              {f.title}
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
          <div className="md:[direction:ltr] relative">
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-30"
              style={{ background: "var(--gradient-glow)" }}
            />
            <img
              src={f.image}
              alt={f.title}
              loading={i === 0 ? "eager" : "lazy"}
              width={1024}
              height={1024}
              className="w-full max-w-sm mx-auto drop-shadow-2xl"
            />
          </div>
        </div>
      ))}
    </div>
  </section>
);
