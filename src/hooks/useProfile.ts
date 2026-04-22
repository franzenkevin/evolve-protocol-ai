import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  sex: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  activity_level: string | null;
  neat: string | null;
  training_days: number | null;
  training_weekdays: string[] | null;
  experience: string | null;
  gym_type: string | null;
  injuries: string | null;
  preferred_foods: string[] | null;
  disliked_foods: string | null;
  allergies: string | null;
  sleep_hours: number | null;
  stress_level: string | null;
  training_time: string | null;
  sweet_preference: string | null;
  supplements: string[] | null;
  free_meals: string | null;
  meal_count: number | null;
  avatar_url: string | null;
  cardio_enabled: boolean | null;
  cardio_frequency: string | null;
  cardio_duration: string | null;
  cardio_timing: string | null;
  cardio_type_preference: string | null;
  ai_data_consent: boolean | null;
  ai_data_consent_at: string | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  body_emphasis: string | null;
  extra_activities: string | null;
  current_diet_description: string | null;
  disliked_from_list: string | null;
  onboarding_complete: boolean;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("Not authenticated");
      // Try update first
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .insert({ ...updates, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", user?.id], data);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};
