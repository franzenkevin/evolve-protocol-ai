import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FoodDiaryEntry {
  id: string;
  user_id: string;
  entry_date: string;
  food_id: string | null;
  name: string;
  grams: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calories: number;
  meal_label: string | null;
  created_at: string;
  updated_at: string;
}

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const useFoodDiary = (date: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["food-diary", user?.id, date],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("food_diary_entries" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FoodDiaryEntry[];
    },
    enabled: !!user,
  });
};

export const useAddDiaryEntry = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<FoodDiaryEntry, "id" | "user_id" | "created_at" | "updated_at" | "entry_date">) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...entry, user_id: user.id, entry_date: todayStr() };
      const { data, error } = await supabase
        .from("food_diary_entries" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-diary"] }),
  });
};

export const useUpdateDiaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, grams, protein, carbs, fat, fiber, calories, meal_label }: Partial<FoodDiaryEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("food_diary_entries" as any)
        .update({ grams, protein, carbs, fat, fiber, calories, meal_label } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-diary"] }),
  });
};

export const useDeleteDiaryEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_diary_entries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["food-diary"] }),
  });
};
