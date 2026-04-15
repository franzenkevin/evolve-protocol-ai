import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { User, Ruler, Weight, Target } from "lucide-react";

const SectionMyData = () => {
  const { data: profile } = useProfile();

  if (!profile) return null;

  const items = [
    { icon: User, label: "Nome", value: profile.full_name || "—" },
    { icon: Ruler, label: "Altura", value: profile.height ? `${profile.height} cm` : "—" },
    { icon: Weight, label: "Peso", value: profile.weight ? `${profile.weight} kg` : "—" },
    { icon: Target, label: "Objetivo", value: profile.goal || "—" },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Meus Dados</h3>
      <Card className="p-3 card-gradient border-border space-y-2">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <Icon size={14} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">{label}:</span>
            <span className="text-foreground font-medium truncate">{value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default SectionMyData;
