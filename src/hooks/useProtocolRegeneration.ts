import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProtocolRegeneration {
  id: string;
  user_id: string;
  status: string;
  used_at: string | null;
  created_at: string;
  amount_brl: number;
}

/**
 * Verifica se o usuário tem créditos disponíveis para regenerar o protocolo
 * antes dos 60 dias. Regra: 1x ao ano (12 meses).
 */
export const useProtocolRegenStatus = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["protocol-regen", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data, error } = await supabase
        .from("protocol_regenerations" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", oneYearAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const list = (data || []) as unknown as ProtocolRegeneration[];
      const usedThisYear = list.filter((r) => r.used_at).length;
      const availableCredit = list.find(
        (r) => (r.status === "paid" || r.status === "granted") && !r.used_at
      );

      return {
        usedThisYear,
        canPurchase: usedThisYear === 0 && !availableCredit,
        availableCredit: availableCredit || null,
        history: list,
      };
    },
    enabled: !!user,
  });
};

/**
 * Marca o crédito como usado quando o usuário regenera o protocolo.
 */
export const useConsumeRegenCredit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (regenId: string) => {
      const { error } = await supabase
        .from("protocol_regenerations" as any)
        .update({ used_at: new Date().toISOString() })
        .eq("id", regenId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-regen"] });
      qc.invalidateQueries({ queryKey: ["protocol"] });
    },
  });
};
