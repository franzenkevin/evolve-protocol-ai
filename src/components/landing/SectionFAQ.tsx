import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_CONTENT } from "@/content/landing";

export const SectionFAQ = () => (
  <section className="py-20 border-t border-border">
    <div className="max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-2">
          Dúvidas?
        </p>
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-foreground leading-tight">
          Antes que <span className="text-gradient">você pergunte.</span>
        </h2>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {FAQ_CONTENT.map((item, i) => (
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
