import coach from "@/assets/coach-kevin.jpg";
import { CheckCircle2 } from "lucide-react";

const POINTS = [
  "Anos formando atletas naturais e amadores em busca de evolução real",
  "Metodologia construída na prática e validada por base científica atual",
  "IA usada como ferramenta — quem dita as regras do protocolo é o profissional",
];

export const SectionAbout = () => (
  <section className="py-20 border-t border-border">
    <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-20"
          style={{ background: "var(--gradient-glow)" }}
        />
        <img
          src={coach}
          alt="Kevin Franzen, treinador responsável pela metodologia"
          loading="lazy"
          width={1024}
          height={1024}
          className="rounded-2xl w-full object-cover aspect-square shadow-2xl border border-border"
        />
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Quem está por trás</p>
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight mb-4">
          Kevin <span className="text-gradient">Franzen</span>
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed mb-6">
          Sou treinador apaixonado por transformação real. Passei anos vendo gente boa desperdiçar tempo
          com plano genérico, dieta restritiva e promessa milagrosa. Construí esse app pra entregar o que
          eu daria pro meu aluno presencial — só que escalado, 24h, no seu bolso.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed mb-6">
          A metodologia une o que funciona na sala de musculação com o que a ciência confirma no laboratório.
          A IA acelera o cálculo. Mas a regra final é sempre minha.
        </p>

        <ul className="space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-primary shrink-0 mt-1" />
              <span className="text-sm text-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);
