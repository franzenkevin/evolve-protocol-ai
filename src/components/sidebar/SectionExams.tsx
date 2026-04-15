import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FlaskConical, Syringe, ShieldCheck } from "lucide-react";
import { useState } from "react";

const EXAM_CHECKLIST = [
  "Hemograma completo",
  "Glicemia de jejum",
  "Insulina de jejum",
  "HbA1c",
  "Colesterol total + frações",
  "Triglicerídeos",
  "TSH e T4 livre",
  "Testosterona total e livre",
  "Estradiol",
  "SHBG",
  "Cortisol",
  "Vitamina D (25-OH)",
  "Vitamina B12",
  "Ferritina",
  "TGO / TGP",
  "Creatinina",
  "Ureia",
  "PCR ultra-sensível",
];

const SERVICES = [
  {
    icon: FlaskConical,
    title: "Análise de Exames",
    desc: "Interpretação detalhada dos seus exames com recomendações personalizadas.",
    price: "A definir",
  },
  {
    icon: Syringe,
    title: "Análise + Protocolo Hormonal",
    desc: "Análise completa dos exames + protocolo hormonal personalizado.",
    price: "A definir",
  },
  {
    icon: ShieldCheck,
    title: "Acompanhamento Anual",
    desc: "Análise de exames + protocolo hormonal + acompanhamento anual completo.",
    price: "A definir",
  },
];

const SectionExams = () => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (exam: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(exam) ? next.delete(exam) : next.add(exam);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Exames & Protocolo</h3>

      <Card className="p-3 card-gradient border-border">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Lista de exames</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{checked.size}/{EXAM_CHECKLIST.length}</span>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
          {EXAM_CHECKLIST.map((exam) => (
            <label key={exam} className="flex items-center gap-2 cursor-pointer text-xs py-0.5 hover:bg-secondary/50 rounded px-1">
              <input
                type="checkbox"
                checked={checked.has(exam)}
                onChange={() => toggle(exam)}
                className="rounded border-border accent-primary w-3 h-3"
              />
              <span className={checked.has(exam) ? "text-foreground" : "text-muted-foreground"}>{exam}</span>
            </label>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        {SERVICES.map(({ icon: Icon, title, desc, price }) => (
          <Card key={title} className="p-3 card-gradient border-border">
            <div className="flex items-start gap-2">
              <Icon size={16} className="text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold text-primary">{price}</span>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">Contratar</Button>
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
