import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorkoutFeedback {
  id: string;
  user_id: string;
  protocol_id: string | null;
  day_index: number;
  session_date: string;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useWorkoutFeedback = (dayIndex: number, sessionDate: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["workout_feedback", user?.id, dayIndex, sessionDate],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("workout_feedback" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("day_index", dayIndex)
        .eq("session_date", sessionDate)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as WorkoutFeedback | null;
    },
    enabled: !!user,
  });
};

export const useSaveWorkoutFeedback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      protocol_id?: string | null;
      day_index: number;
      session_date: string;
      rating: number;
      notes?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("workout_feedback" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("day_index", input.day_index)
        .eq("session_date", input.session_date)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("workout_feedback" as any)
          .update({ rating: input.rating, notes: input.notes ?? null })
          .eq("id", (existing as any).id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("workout_feedback" as any)
        .insert({
          user_id: user.id,
          protocol_id: input.protocol_id ?? null,
          day_index: input.day_index,
          session_date: input.session_date,
          rating: input.rating,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_feedback"] });
    },
  });
};
