import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonthlyChallenge {
  id: string;
  title: string;
  description: string | null;
  reward_points: number;
  month_start: string;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useActiveChallenges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["challenges", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_challenges" as any)
        .select("*")
        .eq("active", true)
        .order("month_start", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MonthlyChallenge[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};

export const useAllChallenges = () => {
  return useQuery({
    queryKey: ["challenges", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_challenges" as any)
        .select("*")
        .order("month_start", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MonthlyChallenge[];
    },
    staleTime: 30_000,
  });
};

export const useChallengeMutations = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["challenges"] });

  const create = useMutation({
    mutationFn: async (
      payload: Pick<MonthlyChallenge, "title" | "description" | "reward_points" | "month_start" | "active">,
    ) => {
      const { error } = await supabase
        .from("monthly_challenges" as any)
        .insert({ ...payload, created_by: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MonthlyChallenge> & { id: string }) => {
      const { error } = await supabase
        .from("monthly_challenges" as any)
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monthly_challenges" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
};
