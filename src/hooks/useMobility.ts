import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MobilityExercise {
  id: string;
  name: string;
  region: string;
  type: string; // dinamico | estatico | ativo | pnf
  duration_seconds: number | null;
  reps: number | null;
  side: string | null; // bilateral | unilateral
  equipment: string | null;
  video_url: string | null;
  image_url: string | null;
  instructions: string | null;
  difficulty: string | null;
}

export const useMobility = () => {
  return useQuery({
    queryKey: ["mobility_exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobility_exercises")
        .select("*")
        .order("region", { ascending: true });
      if (error) throw error;
      return data as MobilityExercise[];
    },
  });
};

export const useCreateMobility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Omit<MobilityExercise, "id">) => {
      const { data, error } = await supabase
        .from("mobility_exercises")
        .insert(m)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobility_exercises"] }),
  });
};

export const useUpdateMobility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MobilityExercise> & { id: string }) => {
      const { data, error } = await supabase
        .from("mobility_exercises")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobility_exercises"] }),
  });
};

export const useDeleteMobility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mobility_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobility_exercises"] }),
  });
};
