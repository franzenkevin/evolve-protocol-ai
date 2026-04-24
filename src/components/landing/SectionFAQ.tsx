import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = [
  {
    q: "Preciso pagar antes de saber o que vou receber?",
    a: "Não. O quiz e a avaliação por foto são gratuitos. Você só decide pagar depois de ver tudo que o app vai entregar pro seu objetivo.",
  },
  {
    q: "Funciona pra iniciante?",
    a: "Sim. O protocolo se ajusta ao seu nível atual — desde quem nunca pisou numa academia até atleta intermediário/avançado. A progressão respeita seu ponto de partida.",
  },
  {
    q: "Em quanto tempo vejo resultado?",
    a: "Os primeiros sinais (energia, força, postura) aparecem em 2 a 4 semanas. A mudança visível geralmente acontece entre 8 e 12 semanas, com adesão ao plano.",
  },
  {
    q: "E se eu treinar em casa, sem academia?",
    a: "O treino se adapta ao seu equipamento — academia completa, garagem com halteres ou só peso corporal. A metodologia é a mesma, o caminho muda.",
  },
  {
    q: "O protocolo é só pra hipertrofia?",
    a: "Não. A metodologia atende hipertrofia, emagrecimento, recomposição e performance. Você define o objetivo no quiz e o protocolo é construído pra ele.",
  },
  {
    q: "Tem coach ou é só app?",
    a: "Você tem um coach IA 24/7 dentro do app pra tirar dúvidas, ajustar exercício, sugerir substituição. Tudo dentro das regras definidas pelo treinador responsável.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, sem multa, sem letra miúda. Cancelou, segue até o fim do período pago e acabou.",
  },
];

export const SectionFAQ = () => (
  <section className="py-20 border-t border-border">
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">Dúvidas?</p>
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
          Antes que <span className="text-gradient">você pergunte.</span>
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {FAQ.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border border-border rounded-lg px-4 bg-card/40"
          >
            <AccordionTrigger className="text-left font-heading font-semibold text-foreground hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);
