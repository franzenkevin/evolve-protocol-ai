import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarHeader from "./SidebarHeader";
import SectionMyData from "./SectionMyData";
import SectionRanking from "./SectionRanking";
import SectionReferrals from "./SectionReferrals";
import SectionPlan from "./SectionPlan";
import SectionMeetings from "./SectionMeetings";
import SectionJournal from "./SectionJournal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Card } from "@/components/ui/card";
import { Headphones, FileText, Shield, Star, MessageSquare, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAC_EMAIL = "suporte@hypertrophy.app";

const AppSidebar = ({ open, onOpenChange }: AppSidebarProps) => {
  const navigate = useNavigate();

  const handleSAC = () => {
    window.location.href = `mailto:${SAC_EMAIL}?subject=Suporte%20Hypertrophy`;
  };

  const handleFeedback = () => {
    // Placeholder: future link to Play Store / App Store
    window.open("https://play.google.com/store", "_blank");
  };

  const handleTerms = () => {
    onOpenChange(false);
    navigate("/terms");
  };

  const EXTRA_ITEMS = [
    { icon: Mail, label: "SAC / Suporte", desc: "Envie um e-mail para nosso time", onClick: handleSAC },
    { icon: MessageSquare, label: "Feedback", desc: "Avalie na loja de apps", onClick: handleFeedback },
    { icon: Star, label: "Avaliar o app", desc: "Dê sua nota na loja", onClick: handleFeedback },
    { icon: FileText, label: "Termos de uso", desc: "Termos e Política de Privacidade", onClick: handleTerms },
    { icon: Shield, label: "Política de privacidade", desc: "Seus dados protegidos (LGPD)", onClick: handleTerms },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[320px] sm:w-[360px] bg-background border-border">
        <VisuallyHidden>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Menu lateral do aplicativo</SheetDescription>
        </VisuallyHidden>
        <SidebarHeader />
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-5 pb-8">
            <SectionMyData />
            <SectionRanking />
            <SectionReferrals />
            <SectionPlan />
            <SectionMeetings />
            <SectionJournal />

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
