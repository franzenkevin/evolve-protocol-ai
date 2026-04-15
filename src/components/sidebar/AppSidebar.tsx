import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarHeader from "./SidebarHeader";
import SectionMyData from "./SectionMyData";
import SectionReferrals from "./SectionReferrals";
import SectionPlan from "./SectionPlan";
import SectionJournal from "./SectionJournal";
import SectionMeetings from "./SectionMeetings";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { SheetDescription } from "@/components/ui/sheet";

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
            <SectionJournal />
            <SectionMeetings />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
