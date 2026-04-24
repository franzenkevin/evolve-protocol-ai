import { CheckCircle2 } from "lucide-react";
import { ABOUT_CONTENT } from "@/content/landing";

export const SectionAbout = () => (
  <section className="py-20 border-t border-border">
    <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <div className="relative">
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-20"
          style={{ background: "var(--gradient-glow)" }}
        />
        <img
          src={ABOUT_CONTENT.photo}
          alt={`${ABOUT_CONTENT.firstName} ${ABOUT_CONTENT.lastName}, treinador responsável pela metodologia`}
          loading="lazy"
          width={1024}
          height={1024}
          className="rounded-2xl w-full object-cover aspect-square shadow-2xl border border-border"
        />
      </div>

      <div>
        <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">
          {ABOUT_CONTENT.eyebrow}
        </p>
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight mb-4">
          {ABOUT_CONTENT.firstName}{" "}
          <span className="text-gradient">{ABOUT_CONTENT.lastName}</span>
        </h2>

        {ABOUT_CONTENT.paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-base text-muted-foreground leading-relaxed mb-6 last:mb-6"
          >
            {p}
          </p>
        ))}

        <ul className="space-y-3">
          {ABOUT_CONTENT.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-primary shrink-0 mt-1" />
              <span className="text-sm text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);
