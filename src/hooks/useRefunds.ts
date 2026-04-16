import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RefundRequest = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  reason: string;
  amount_brl: number | null;
  status: "pending" | "approved" | "denied" | "refunded";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const useAllRefunds = () =>
  useQuery({
    queryKey: ["refunds-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RefundRequest[];
    },
  });

export const useMyRefunds = (userId: string | undefined) =>
  useQuery({
    queryKey: ["refunds-my", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RefundRequest[];
    },
  });

export const useCreateRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { user_id: string; reason: string; amount_brl?: number | null; subscription_id?: string | null }) => {
      const { data, error } = await supabase.from("refund_requests").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["refunds-my"] });
      qc.invalidateQueries({ queryKey: ["refunds-all"] });
    },
  });
};

export const useUpdateRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, admin_notes, reviewed_by }: { id: string; status: RefundRequest["status"]; admin_notes?: string; reviewed_by: string }) => {
      const { data, error } = await supabase
        .from("refund_requests")
        .update({ status, admin_notes, reviewed_by, reviewed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["refunds-all"] });
      qc.invalidateQueries({ queryKey: ["refunds-my"] });
    },
  });
};
