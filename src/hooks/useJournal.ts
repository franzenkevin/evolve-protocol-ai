import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JournalArticle {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  excerpt: string | null;
  read_time_minutes: number | null;
  tags: string[] | null;
  author: string | null;
  category: string | null;
  image_url: string | null;
  source_url: string | null;
  published_at: string;
  created_at: string;
}

export const useJournalArticles = () => {
  return useQuery({
    queryKey: ["journal-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as JournalArticle[];
    },
  });
};

export const useCreateJournalArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (article: {
      title: string;
      summary: string;
      content?: string;
      excerpt?: string;
      category?: string;
      tags?: string[];
      author?: string;
      image_url?: string;
      source_url?: string;
      read_time_minutes?: number;
    }) => {
      const { data, error } = await supabase
        .from("journal_articles")
        .insert(article as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-articles"] });
    },
  });
};

export const useDeleteJournalArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-articles"] });
    },
  });
};
