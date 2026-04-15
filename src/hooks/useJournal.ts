import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useJournalArticles = () => {
  return useQuery({
    queryKey: ["journal-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
};
