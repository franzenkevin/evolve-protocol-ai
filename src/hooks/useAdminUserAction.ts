import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AdminAction =
  | { action: "update_profile"; target_user_id: string; payload: Record<string, unknown> }
  | { action: "update_email"; target_user_id: string; payload: { email: string } }
  | { action: "upsert_subscription"; target_user_id: string; payload: Record<string, unknown> }
  | { action: "cancel_subscription"; target_user_id: string }
  | { action: "set_role"; target_user_id: string; payload: { role: "admin" | "user" } }
  | { action: "grant_protocol_regen"; target_user_id: string }
  | { action: "delete_user"; target_user_id: string };

export const useAdminUserAction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AdminAction) => {
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: input,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
  });
};
