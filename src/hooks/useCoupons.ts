import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

async function syncCouponToProvider(args: {
  action: "upsert" | "archive";
  code: string;
  description?: string | null;
  discount_percent?: number;
  valid_until?: string | null;
  max_uses?: number | null;
  active?: boolean;
}) {
  try {
    const { error } = await supabase.functions.invoke("sync-coupon", { body: args });
    if (error) console.error("[sync-coupon] error", error);
  } catch (e) {
    console.error("[sync-coupon] failed", e);
  }
}

export const useCoupons = () =>
  useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });

export const useCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      code: string;
      description?: string | null;
      discount_percent: number;
      valid_until?: string | null;
      max_uses?: number | null;
      created_by: string;
    }) => {
      const { data, error } = await supabase.from("coupons").insert(input).select().single();
      if (error) throw error;
      // Sync to Stripe — non-blocking on fail
      await syncCouponToProvider({
        action: "upsert",
        code: data.code,
        description: data.description,
        discount_percent: data.discount_percent,
        valid_until: data.valid_until,
        max_uses: data.max_uses,
        active: data.active,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase.from("coupons").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await syncCouponToProvider({
        action: "upsert",
        code: data.code,
        description: data.description,
        discount_percent: data.discount_percent,
        valid_until: data.valid_until,
        max_uses: data.max_uses,
        active: data.active,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch code first so we can archive on Stripe
      const { data: existing } = await supabase.from("coupons").select("code").eq("id", id).maybeSingle();
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      if (existing?.code) {
        await syncCouponToProvider({ action: "archive", code: existing.code });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useResyncCoupon = () => {
  return useMutation({
    mutationFn: async (c: Coupon) => {
      await syncCouponToProvider({
        action: "upsert",
        code: c.code,
        description: c.description,
        discount_percent: c.discount_percent,
        valid_until: c.valid_until,
        max_uses: c.max_uses,
        active: c.active,
      });
    },
  });
};
