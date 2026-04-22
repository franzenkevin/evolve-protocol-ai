import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarHeader from "./SidebarHeader";
import SectionMyData from "./SectionMyData";
import SectionRanking from "./SectionRanking";
import SectionReferrals from "./SectionReferrals";
import SectionPartnerships from "./SectionPartnerships";
import SectionPlan from "./SectionPlan";
import SectionMeetings from "./SectionMeetings";
import SectionJournal from "./SectionJournal";
import { Card } from "@/components/ui/card";
import { Headphones, FileText, Shield, Star, MessageSquare, Mail, ShieldCheck, RefreshCw, LifeBuoy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAC_EMAIL = "suporte@hypertrophy.app";

const AppSidebar = ({ open, onOpenChange }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { data: isAdmin } = useIsAdmin();

  const handleSupport = () => {
    onOpenChange(false);
    navigate("/support");
  };

  const handleFeedback = () => {
    onOpenChange(false);
    navigate("/feedback");
  };

  const handleRateApp = () => {
    // Placeholder for store rating - opens internal feedback for now
    onOpenChange(false);
    navigate("/feedback");
  };

  const handleTerms = () => {
    onOpenChange(false);
    navigate("/terms");
  };

  const EXTRA_ITEMS = [
    { icon: LifeBuoy, label: "SAC / Suporte", desc: "Fale com nosso time pelo app", onClick: handleSupport },
    { icon: MessageSquare, label: "Feedback de alunos", desc: "Mural público de depoimentos", onClick: handleFeedback },
    { icon: Star, label: "Avaliar o app", desc: "Dê sua nota e comentário", onClick: handleRateApp },
    { icon: FileText, label: "Termos e Política de Privacidade", desc: "Termos de uso + LGPD em uma página", onClick: handleTerms },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[320px] sm:w-[360px] bg-background border-border">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Menu lateral do aplicativo</SheetDescription>
        <SidebarHeader onClose={() => onOpenChange(false)} />
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-5 pb-8">
            <SectionMyData />
            <SectionRanking />
            <SectionReferrals />
            <SectionPartnerships />
            <SectionPlan />

            <Card
              className="p-3 flex items-center gap-3 cursor-pointer card-gradient border-primary/30 hover:border-primary/50 transition-colors"
              onClick={() => { onOpenChange(false); navigate("/new-protocol"); }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <RefreshCw size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-semibold">Quero novo protocolo</p>
                <p className="text-[10px] text-muted-foreground">R$ 19,90 — antecipar antes de 60 dias (1x/ano)</p>
              </div>
            </Card>

            <SectionMeetings />
            <SectionJournal />

            {isAdmin && (
              <Card
                className="p-3 flex items-center gap-3 cursor-pointer bg-primary/10 border-primary/30 hover:bg-primary/15 transition-colors"
                onClick={() => { onOpenChange(false); navigate("/admin"); }}
              >
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-semibold">Painel do Criador</p>
                  <p className="text-[10px] text-muted-foreground">Vendas, leads, conteúdo e métricas</p>
                </div>
              </Card>
            )}

            {/* Standard app options */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Mais opções</h3>
              {EXTRA_ITEMS.map(({ icon: Icon, label, desc, onClick }) => (
                <Card
                  key={label}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={onClick}
                >
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Version */}
            <p className="text-[10px] text-muted-foreground text-center pt-2">Hypertrophy v1.0.0</p>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
