import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FlaskConical, Syringe, ShieldCheck, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";

const EXAM_CHECKLIST = [
  // Bioquímica básica
  "Glicose em jejum",
  "Hemograma completo",
  "Ureia",
  "Creatinina",
  "CPK (Creatinoquinase)",
  "Albumina",
  // Ferro
  "Ferritina",
  "Ferro sérico",
  // Eletrólitos
  "Sódio",
  "Potássio",
  // Função hepática
  "TGO (AST)",
  "TGP (ALT)",
  "Gama GT",
  "Bilirrubinas (total e frações)",
  // Hormônios sexuais
  "Testosterona total",
  "Testosterona livre",
  "DHT (Di-hidrotestosterona)",
  "SHBG",
  "Prolactina",
  "Estradiol",
  "LH",
  "FSH",
  // Tireoide
  "TSH",
  "T4 livre",
  "T3",
  "T3 reverso",
  // Lipídios
  "Triglicerídeos",
  "Colesterol total",
  "HDL",
  "LDL",
  // Vitaminas
  "25-Hidroxivitamina D",
  "Vitamina B12",
  // Próstata / cardio
  "PSA livre",
  "Troponina",
  // Resistência à insulina
  "Insulina de jejum",
  "HOMA-IR",
  "HOMA-Beta",
  "Hemoglobina glicada (HbA1c)",
];

const SERVICES: {
  icon: typeof FlaskConical;
  title: string;
  desc: string;
  price: string;
  priceId: string;
}[] = [
  {
    icon: FlaskConical,
    title: "Análise de Exames",
    desc: "Interpretação detalhada dos seus exames com recomendações personalizadas.",
    price: "R$ 99,90",
    priceId: "hypertrophy_exam_analysis_once",
  },
  {
    icon: Syringe,
    title: "Análise + Protocolo Hormonal (60 dias)",
    desc: "Análise completa dos exames + protocolo hormonal personalizado com acompanhamento de 60 dias.",
    price: "R$ 297,00",
    priceId: "hypertrophy_hormone_60d_once",
  },
  {
    icon: ShieldCheck,
    title: "Acompanhamento Hormonal Anual",
    desc: "Análise + protocolo hormonal + acompanhamento contínuo por 12 meses.",
    price: "R$ 899,00",
    priceId: "hypertrophy_hormone_annual_once",
  },
];

const SectionExams = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const { openCheckout, loading } = usePaddleCheckout();

  const buy = (priceId: string) => {
    openCheckout({
      priceId,
      successUrl: `${window.location.origin}/checkout/success?type=exam`,
      customData: { purchaseType: "exam" },
    });
  };

  const toggle = (exam: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(exam) ? next.delete(exam) : next.add(exam);
      return next;
    });
  };

  const copyList = () => {
    const text = EXAM_CHECKLIST.map((e) => `• ${e}`).join("\n");
    navigator.clipboard.writeText(`Lista de exames EVORIA:\n\n${text}`);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Exames & Protocolo</h3>

      {/* Explanation card */}
      <Card className="p-3 bg-primary/5 border-primary/20">
        <div className="flex gap-2">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">Como funciona</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Você pode solicitar a lista de exames abaixo por conta própria, pedir orçamento em laboratórios da sua região
              e, com os resultados em mãos, contratar um dos planos de acompanhamento abaixo para análise e protocolo personalizado.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-3 card-gradient border-border">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Lista completa de exames</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{checked.size}/{EXAM_CHECKLIST.length}</span>
        </div>
        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
          {EXAM_CHECKLIST.map((exam) => (
            <label key={exam} className="flex items-center gap-2 cursor-pointer text-xs py-0.5 hover:bg-secondary/50 rounded px-1">
              <input
                type="checkbox"
                checked={checked.has(exam)}
                onChange={() => toggle(exam)}
                className="rounded border-border accent-primary w-3 h-3"
              />
              <span className={checked.has(exam) ? "text-foreground line-through opacity-60" : "text-muted-foreground"}>{exam}</span>
            </label>
          ))}
        </div>
        <Button onClick={copyList} variant="outline" size="sm" className="w-full mt-2 h-7 text-[11px]">
          Copiar lista para o laboratório
        </Button>
      </Card>

      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-wider font-semibold">Planos de acompanhamento</p>
        {SERVICES.map(({ icon: Icon, title, desc, price, priceId }) => (
          <Card key={title} className="p-3 card-gradient border-border">
            <div className="flex items-start gap-2">
              <Icon size={16} className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-sm font-bold text-primary">{price}</span>
                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-3"
                    disabled={loading}
                    onClick={() => buy(priceId)}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : "Contratar"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SectionExams;
