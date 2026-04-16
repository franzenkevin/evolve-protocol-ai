import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  name: string;
  coupon: string;
  url: string;
  desc: string;
}

const PARTNERS: Partner[] = [
  {
    name: "Soldiers Nutrition",
    coupon: "Franzen",
    url: "https://soldiersnutrition.com.br",
    desc: "Suplementação esportiva premium",
  },
  {
    name: "Natuderme Farma",
    coupon: "Franzen20",
    url: "https://natudermefarma.com.br",
    desc: "Manipulação e dermocosméticos",
  },
  {
    name: "Armavitta",
    coupon: "Kevin15",
    url: "https://armavitta.com.br",
    desc: "Loja de roupas fitness",
  },
];

const SectionPartnerships = () => {
  const { toast } = useToast();

  const copyCoupon = (coupon: string) => {
    navigator.clipboard.writeText(coupon);
    toast({ title: "Cupom copiado!", description: coupon });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Parcerias com desconto</h3>
      <div className="space-y-2">
        {PARTNERS.map((p) => (
          <Card key={p.name} className="p-3 card-gradient border-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => copyCoupon(p.coupon)}
                className="flex items-center gap-1.5 flex-1 bg-primary/10 hover:bg-primary/20 transition-colors rounded px-2 py-1.5 group"
                aria-label={`Copiar cupom ${p.coupon}`}
              >
                <Tag size={12} className="text-primary shrink-0" />
                <code className="text-xs font-mono text-primary font-semibold flex-1 text-left">{p.coupon}</code>
                <Copy size={11} className="text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[10px] shrink-0"
                onClick={() => window.open(p.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink size={11} className="mr-1" />
                Site
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SectionPartnerships;
