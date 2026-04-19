import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string | null;
  video_url: string | null;
  instructions: string | null;
  difficulty: string | null;
  movement_pattern: string | null;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  load_type: string | null;
  tempo: string | null;
}

export const useExercises = () => {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as Exercise[];
    },
  });
};

export const useCreateExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ex: Omit<Exercise, "id">) => {
      const { data, error } = await supabase.from("exercises").insert(ex).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
};

export const useUpdateExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase.from("exercises").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
};

export const useDeleteExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
};
