import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DietFeedback {
  id: string;
  user_id: string;
  rated_date: string;
  adherence: number;
  hunger_level: number | null;
  energy_level: number | null;
  digestion: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export const useTodayDietFeedback = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["diet-feedback", "today", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("diet_feedback")
        .select("*")
        .eq("user_id", user.id)
        .eq("rated_date", todayStr())
        .maybeSingle();
      if (error) throw error;
      return data as DietFeedback | null;
    },
    enabled: !!user,
  });
};

export const useUpsertDietFeedback = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Omit<DietFeedback, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        rated_date: input.rated_date || todayStr(),
        adherence: input.adherence ?? 100,
        hunger_level: input.hunger_level ?? null,
        energy_level: input.energy_level ?? null,
        digestion: input.digestion ?? null,
        notes: input.notes ?? null,
      };
      const { data, error } = await supabase
        .from("diet_feedback")
        .upsert(payload, { onConflict: "user_id,rated_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diet-feedback"] });
    },
  });
};
