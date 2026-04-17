import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Food {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calories: number;
  category: string | null;
  portion_grams: number;
  source: string | null;
}

export const useFoods = () => {
  return useQuery({
    queryKey: ["foods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Food[];
    },
  });
};

export const useCreateFood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (food: Omit<Food, "id">) => {
      const { data, error } = await supabase.from("foods").insert(food as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
};

export const useUpdateFood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Food> & { id: string }) => {
      const { data, error } = await supabase
        .from("foods")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
};

export const useDeleteFood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("foods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
};
