import { useState } from "react";
import { Card } from "@/components/ui/card";
import { RESULTS_CONTENT } from "@/content/landing";

export const SectionResults = () => {
  // Mostra "antes" ou "depois" em cada card individualmente
  const [view, setView] = useState<Record<number, "before" | "after">>({});

  return (
    <section className="py-20 border-t border-border bg-card/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">
            Resultados reais
          </p>
          <h2 className="md:text-5xl font-heading font-bold text-foreground leading-tight text-2xl">
            Pessoas que decidiram parar de improvisar e seguir um plano feito pra durar.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Pessoas que decidiram parar de improvisar e seguir um plano feito pra durar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RESULTS_CONTENT.map((r, i) => {
            const current = view[i] ?? "before";
            const showBefore = current === "before";
            return (
              <Card key={r.name} className="overflow-hidden card-gradient border-border">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={showBefore ? r.before : r.after}
                    alt={`${showBefore ? "Antes" : "Depois"} — ${r.name}`}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded">
                    {r.goal}
                  </div>

                  {/* Toggle Antes / Depois */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex bg-background/80 backdrop-blur-sm rounded-full p-1 border border-border">
                    {(["before", "after"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setView((v) => ({ ...v, [i]: opt }))}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${
                          current === opt
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt === "before" ? "Antes" : "Depois"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5">
                  <p className="font-heading font-bold text-foreground">{r.name}</p>
                  <p className="text-sm text-primary font-semibold mb-3">{r.detail}</p>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    "{r.quote}"
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          * Resultados individuais variam conforme adesão ao protocolo.
        </p>
      </div>
    </section>
  );
};
