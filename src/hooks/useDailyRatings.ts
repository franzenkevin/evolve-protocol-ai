import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useDailyRatings = (limit = 30) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily-ratings", user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_ratings")
        .select("*")
        .eq("user_id", user.id)
        .order("rated_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useTodayRating = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily-rating-today", user?.id, today],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("daily_ratings")
        .select("*")
        .eq("user_id", user.id)
        .eq("rated_date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSaveDailyRating = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rating, notes }: { rating: number; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const today = new Date().toISOString().split("T")[0];

      // Check if exists
      const { data: existing } = await supabase
        .from("daily_ratings")
        .select("id")
        .eq("user_id", user.id)
        .eq("rated_date", today)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("daily_ratings")
          .update({ rating, notes })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("daily_ratings")
          .insert({ user_id: user.id, rating, notes, rated_date: today })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["daily-rating-today"] });
    },
  });
};
