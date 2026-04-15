import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorkoutSet {
  type: "warmup" | "valid";
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  protocol_id: string | null;
  day_index: number;
  exercise_id: string;
  exercise_name: string;
  session_date: string;
  sets: WorkoutSet[];
  notes: string | null;
  created_at: string;
}

export const useWorkoutLogs = (dayIndex: number, sessionDate: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workout_logs", user?.id, dayIndex, sessionDate],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("day_index", dayIndex)
        .eq("session_date", sessionDate);
      if (error) throw error;
      return (data || []) as unknown as WorkoutLog[];
    },
    enabled: !!user,
  });
};

export const usePreviousWorkoutLogs = (dayIndex: number, currentDate: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["prev_workout_logs", user?.id, dayIndex, currentDate],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("day_index", dayIndex)
        .lt("session_date", currentDate)
        .order("session_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as WorkoutLog[];
    },
    enabled: !!user,
  });
};

export const useSaveWorkoutLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      protocol_id?: string;
      day_index: number;
      exercise_id: string;
      exercise_name: string;
      session_date: string;
      sets: WorkoutSet[];
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Upsert: check if exists
      const { data: existing } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("day_index", log.day_index)
        .eq("exercise_id", log.exercise_id)
        .eq("session_date", log.session_date)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("workout_logs")
          .update({ sets: JSON.parse(JSON.stringify(log.sets)), notes: log.notes || null })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("workout_logs")
          .insert({
            user_id: user.id,
            protocol_id: log.protocol_id || null,
            day_index: log.day_index,
            exercise_id: log.exercise_id,
            exercise_name: log.exercise_name,
            session_date: log.session_date,
            sets: JSON.parse(JSON.stringify(log.sets)),
            notes: log.notes || null,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout_logs"] });
      queryClient.invalidateQueries({ queryKey: ["prev_workout_logs"] });
    },
  });
};
