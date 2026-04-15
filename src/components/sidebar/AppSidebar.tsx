import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarHeader from "./SidebarHeader";
import SectionMyData from "./SectionMyData";
import SectionReferrals from "./SectionReferrals";
import SectionPlan from "./SectionPlan";
import SectionMeetings from "./SectionMeetings";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Card } from "@/components/ui/card";
import { Headphones, FileText, Shield, Info, Star, MessageSquare } from "lucide-react";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXTRA_ITEMS = [
  { icon: Headphones, label: "SAC / Suporte", desc: "Fale com nosso time" },
  { icon: MessageSquare, label: "Feedback", desc: "Envie suas sugestões" },
  { icon: Star, label: "Avaliar o app", desc: "Dê sua nota na loja" },
  { icon: FileText, label: "Termos de uso", desc: "Leia nossos termos" },
  { icon: Shield, label: "Política de privacidade", desc: "Seus dados protegidos" },
  { icon: Info, label: "Sobre", desc: "Hypertrophy v1.0" },
];

const AppSidebar = ({ open, onOpenChange }: AppSidebarProps) => {
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
            <SectionReferrals />
            <SectionPlan />
            <SectionMeetings />

            {/* Standard app options */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Mais opções</h3>
              {EXTRA_ITEMS.map(({ icon: Icon, label, desc }) => (
                <Card
                  key={label}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
