import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLiveMeetings = () => {
  return useQuery({
    queryKey: ["live-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_meetings")
        .select("*")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });
};
