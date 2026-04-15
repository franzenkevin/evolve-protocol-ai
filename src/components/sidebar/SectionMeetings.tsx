import { useLiveMeetings } from "@/hooks/useLiveMeetings";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, Clock } from "lucide-react";

const SectionMeetings = () => {
  const { data: meetings = [], isLoading } = useLiveMeetings();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Encontros ao Vivo</h3>

      {isLoading ? (
        <Card className="p-3 card-gradient border-border animate-pulse h-16" />
      ) : meetings.length === 0 ? (
        <Card className="p-4 card-gradient border-border text-center">
          <Video size={20} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Nenhum encontro agendado.</p>
          <p className="text-[10px] text-muted-foreground mt-1">Fique ligado para os próximos eventos!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {meetings.map((meeting) => {
            const date = new Date(meeting.scheduled_at);
            return (
              <Card key={meeting.id} className="p-3 card-gradient border-border">
                <p className="text-sm font-medium text-foreground">{meeting.title}</p>
                {meeting.description && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{meeting.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar size={10} />{date.toLocaleDateString("pt-BR")}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>{meeting.duration_minutes} min</span>
                </div>
                {meeting.meeting_url && (
                  <Button size="sm" className="w-full mt-2 h-7 text-[10px]" asChild>
                    <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                      <Video size={12} className="mr-1" />Entrar
                    </a>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SectionMeetings;
