import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RankingEntry {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  checkins_count: number;
  workouts_count: number;
  total_score: number;
  is_current_user: boolean;
}

export const useMonthlyRanking = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["monthly-ranking", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_monthly_ranking" as any);
      if (error) throw error;
      return (data || []) as RankingEntry[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};
