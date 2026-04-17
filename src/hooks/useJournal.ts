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
  status: string;
  ai_generated: boolean;
  ai_sources: any[] | null;
  ai_prompt: string | null;
  published_at: string;
  created_at: string;
}

export const useJournalArticles = (includeDrafts = false) => {
  return useQuery({
    queryKey: ["journal-articles", includeDrafts],
    queryFn: async () => {
      let q = supabase
        .from("journal_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(100);
      if (!includeDrafts) q = q.eq("status", "published");
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as JournalArticle[];
    },
  });
};

export const useCreateJournalArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Partial<JournalArticle> & { title: string; summary: string }) => {
      const { data, error } = await supabase
        .from("journal_articles")
        .insert(article as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-articles"] }),
  });
};

export const useUpdateJournalArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JournalArticle> & { id: string }) => {
      const { data, error } = await supabase
        .from("journal_articles")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-articles"] }),
  });
};

export const useDeleteJournalArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal-articles"] }),
  });
};

export interface JournalAIDraft {
  title: string;
  summary: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  read_time_minutes: number;
  sources: { title?: string; uri: string }[];
  ai_prompt: string;
}

export const useResearchJournalTopic = () => {
  return useMutation({
    mutationFn: async (topic: string): Promise<JournalAIDraft> => {
      const { data, error } = await supabase.functions.invoke("journal-research", {
        body: { topic },
      });
      if (error) {
        const msg = (error as any)?.context?.error || error.message;
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      return data as JournalAIDraft;
    },
  });
};
