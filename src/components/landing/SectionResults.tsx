import { Card } from "@/components/ui/card";
import t1 from "@/assets/transformation-1.jpg";
import t2 from "@/assets/transformation-2.jpg";
import t3 from "@/assets/transformation-3.jpg";

const RESULTS = [
  {
    img: t1,
    name: "Lucas, 32",
    goal: "Emagrecimento",
    detail: "92 kg → 78 kg em 5 meses",
    quote: "Nunca pensei que comer bem podia ser tão simples. O app fez o trabalho pesado.",
  },
  {
    img: t2,
    name: "Mariana, 28",
    goal: "Recomposição",
    detail: "Perdeu 7% de gordura, ganhou 3 kg de músculo",
    quote: "Treino e dieta no piloto automático. Só foco em executar.",
  },
  {
    img: t3,
    name: "Pedro, 22",
    goal: "Hipertrofia",
    detail: "+11 kg de massa magra em 8 meses",
    quote: "Saí do 'falso magro' pra primeira vez vendo músculo de verdade aparecer.",
  },
];

export const SectionResults = () => (
  <section className="py-20 border-t border-border bg-card/30">
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Resultados reais</p>
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
          Quem confiou no processo, <br />
          <span className="text-gradient">virou outra pessoa.</span>
        </h2>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
          Histórias de quem decidiu parar de improvisar e seguir um plano feito pra durar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RESULTS.map((r) => (
          <Card key={r.name} className="overflow-hidden card-gradient border-border">
            <div className="relative aspect-square overflow-hidden">
              <img
                src={r.img}
                alt={`Transformação de ${r.name}`}
                loading="lazy"
                width={1024}
                height={1024}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded">
                {r.goal}
              </div>
            </div>
            <div className="p-5">
              <p className="font-heading font-bold text-foreground">{r.name}</p>
              <p className="text-sm text-primary font-semibold mb-3">{r.detail}</p>
              <p className="text-sm text-muted-foreground italic leading-relaxed">"{r.quote}"</p>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        * Resultados individuais variam conforme adesão ao protocolo.
      </p>
    </div>
  </section>
);
