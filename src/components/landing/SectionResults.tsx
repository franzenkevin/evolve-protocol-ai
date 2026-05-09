import { useEffect, useRef, useState } from "react";
import t1 from "@/assets/transformation-1.webp";
import t2 from "@/assets/transformation-2.webp";
import t3 from "@/assets/transformation-3.webp";
import t4 from "@/assets/transformation-4.webp";
import t5 from "@/assets/transformation-5.webp";
import t6 from "@/assets/transformation-6.webp";
import t7 from "@/assets/transformation-7.webp";
import t8 from "@/assets/transformation-8.webp";
import t9 from "@/assets/transformation-9.webp";
import t10 from "@/assets/transformation-10.webp";

// Ordem intercalada por gênero e objetivo
const PHOTOS = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10];

const AUTOPLAY_MS = 2000;

export const SectionResults = () => {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((i) => (i + 1) % PHOTOS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) {
      setIndex((i) =>
        dx < 0 ? (i + 1) % PHOTOS.length : (i - 1 + PHOTOS.length) % PHOTOS.length
      );
    }
    startX.current = null;
    setTimeout(() => (pausedRef.current = false), 1500);
  };

  return (
    <section className="py-20 border-t border-border bg-card/30">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">
            Resultados reais
          </p>
          <h2 className="md:text-4xl font-heading font-bold text-foreground leading-tight text-2xl">
            <span className="text-gradient">Resultados de alunos que seguem o método</span>
          </h2>
        </div>

        <div
          className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-[0_0_60px_-20px_hsl(var(--primary)/0.4)]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
        >
          <div
            ref={trackRef}
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {PHOTOS.map((src, i) => (
              <div key={i} className="min-w-full aspect-square">
                <img
                  src={src}
                  alt={`Resultado ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-background/70 backdrop-blur-sm rounded-full px-2 py-1.5 border border-border">
            {PHOTOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir para foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          * Resultados individuais variam conforme adesão ao protocolo.
        </p>
      </div>
    </section>
  );
};
