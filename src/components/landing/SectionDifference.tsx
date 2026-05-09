import { useState } from "react";
import { Plus, Minus, Sparkles, Brain, UserCheck } from "lucide-react";

const CARDS = [
  {
    icon: Sparkles,
    question: "“É só mais um app de treino?”",
    answer: [
      "Não.",
      "App comum entrega lista de exercícios.",
      "A EVORIA organiza contexto, rotina, objetivo, leitura corporal, estrutura alimentar, treino e progresso dentro de uma lógica única.",
    ],
    highlight: ["A diferença não é ter tecnologia.", "É ter método por trás da tecnologia."],
  },
  {
    icon: Brain,
    question: "“Mas o ChatGPT já faz isso.”",
    answer: [
      "Faz uma resposta. Não conduz um processo.",
      "Mesmo com um bom prompt, uma IA solta depende do que você sabe pedir, do que você lembra de informar e da sua capacidade de interpretar a resposta.",
      "A EVORIA já nasce com uma estrutura de perguntas, critérios e parâmetros construídos para guiar o processo desde o início.",
    ],
    highlight: ["ChatGPT responde comando.", "EVORIA organiza direção."],
  },
  {
    icon: UserCheck,
    question: "“E uma consultoria online?”",
    answer: [
      "Depende da consultoria.",
      "A consultoria premium de verdade tem leitura humana, ajuste fino e acompanhamento próximo.",
      "Mas muita gente no mercado recebe algo que parece personalizado, mas no fundo é padrão adaptado, pouco contexto e pouca análise real.",
      "A EVORIA foi criada para quem quer fugir do genérico e ter mais estrutura, clareza e autonomia.",
    ],
    highlight: ["Não é consultoria barata.", "É outra categoria."],
  },
];

export const SectionDifference = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 border-t border-border">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-3">
            ANTES DE COMPARAR, ENTENDA A DIFERENÇA
          </p>
          <h2 className="text-2xl md:text-5xl font-heading font-bold text-foreground leading-tight mb-5">
            Antes de comparar a EVORIA com qualquer app, IA ou consultoria…{" "}
            <span className="text-gradient">entenda uma coisa.</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A EVORIA não nasceu para entregar uma resposta pronta. Ela foi construída para seguir
            uma lógica de método, contexto e decisão, com parâmetros criados a partir de anos de
            prática real.
          </p>
        </div>

        <div className="space-y-3">
          {CARDS.map(({ icon: Icon, question, answer, highlight }, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "border-primary/40 bg-card/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.35)]"
                    : "border-border bg-card/30 hover:border-primary/20"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left"
                  aria-expanded={isOpen}
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isOpen ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="flex-1 font-heading font-bold text-base md:text-lg text-foreground leading-snug">
                    {question}
                  </h3>
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      isOpen
                        ? "border-primary/50 text-primary rotate-0"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 md:px-6 pb-6 pl-[4.5rem] space-y-3">
                      {answer.map((line, k) => (
                        <p
                          key={k}
                          className="text-sm md:text-base text-muted-foreground leading-relaxed"
                        >
                          {line}
                        </p>
                      ))}
                      <div className="mt-4 pt-4 border-t border-primary/15">
                        {highlight.map((line, k) => (
                          <p
                            key={k}
                            className="text-sm md:text-base font-heading font-semibold text-primary leading-snug"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-base md:text-lg font-heading font-semibold text-foreground leading-snug">
            A EVORIA não tenta parecer inteligente.
            <br />
            <span className="text-gradient">Ela foi construída para organizar melhor o processo.</span>
          </p>
        </div>
      </div>
    </section>
  );
};
