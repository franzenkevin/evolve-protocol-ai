import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveProtocol } from "@/hooks/useProtocol";

export interface MilestoneState {
  daysSinceStart: number;
  // Próximo marco semanal (7, 14, 21, …) — se hoje é múltiplo de 7, retorna hoje.
  nextWeeklyDay: number;
  isWeeklyDue: boolean; // hoje é múltiplo de 7 (>=7)
  isMid30Due: boolean; // dia 29 (D-1) ou 30
  isMid30Tomorrow: boolean; // D-1
  isFinal60Due: boolean; // dia 59 ou 60+
  isFinal60Tomorrow: boolean;
  midDone: boolean; // já enviou feedback de 30
  finalDone: boolean; // já enviou feedback de 60
}

export const useProtocolMilestone = () => {
  const { user } = useAuth();
  const { data: protocol } = useActiveProtocol();

  return useQuery({
    queryKey: ["protocol-milestone", user?.id, protocol?.id],
    enabled: !!user && !!protocol,
    queryFn: async (): Promise<MilestoneState | null> => {
      if (!protocol) return null;
      const start = new Date(protocol.start_date + "T00:00:00");
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const days = Math.floor(diffMs / 86400000);

      const nextWeeklyDay = days <= 0 ? 7 : Math.ceil(days / 7) * 7;

      const { data: feedbacks } = await supabase
        .from("protocol_milestone_feedbacks")
        .select("milestone_day")
        .eq("user_id", user!.id)
        .eq("protocol_id", protocol.id);

      const midDone = !!feedbacks?.some((f) => f.milestone_day === 30);
      const finalDone = !!feedbacks?.some((f) => f.milestone_day === 60);

      return {
        daysSinceStart: days,
        nextWeeklyDay,
        isWeeklyDue: days >= 7 && days % 7 === 0,
        isMid30Tomorrow: days === 29 && !midDone,
        isMid30Due: days >= 30 && days < 60 && !midDone,
        isFinal60Tomorrow: days === 59 && !finalDone,
        isFinal60Due: days >= 60 && !finalDone,
        midDone,
        finalDone,
      };
    },
  });
};
