import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Protocol {
  id: string;
  user_id: string;
  training: any;
  diet: any;
  start_date: string;
  end_date: string;
  status: string;
  version: number;
  created_at: string;
}

export const useActiveProtocol = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["protocol", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Protocol | null;
    },
    enabled: !!user,
  });
};

export const useCreateProtocol = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (protocol: { training: any; diet: any }) => {
      if (!user) throw new Error("Not authenticated");
      // Archive existing active protocols
      await supabase
        .from("protocols")
        .update({ status: "archived" })
        .eq("user_id", user.id)
        .eq("status", "active");

      const { data, error } = await supabase
        .from("protocols")
        .insert({
          user_id: user.id,
          training: protocol.training,
          diet: protocol.diet,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["protocol", user?.id] });
    },
  });
};
