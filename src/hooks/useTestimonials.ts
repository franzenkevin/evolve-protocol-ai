import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Testimonial {
  id: string;
  user_id: string;
  rating: number;
  text: string;
  approved: boolean;
  created_at: string;
}

export interface TestimonialWithProfile extends Testimonial {
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

export const useApprovedTestimonials = () => {
  return useQuery({
    queryKey: ["testimonials", "approved"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_testimonials")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((t) => t.user_id)));
      let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        for (const p of profiles || []) {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
        }
      }

      return (data || []).map((t) => ({
        ...t,
        profile: profilesMap.get(t.user_id) || null,
      })) as TestimonialWithProfile[];
    },
  });
};

export const useMyTestimonial = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["testimonials", "mine", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("app_testimonials")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Testimonial | null;
    },
    enabled: !!user,
  });
};

export const useUpsertTestimonial = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rating, text, id }: { rating: number; text: string; id?: string }) => {
      if (!user) throw new Error("Não autenticado");
      if (id) {
        const { data, error } = await supabase
          .from("app_testimonials")
          .update({ rating, text })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("app_testimonials")
        .insert({ user_id: user.id, rating, text })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
};

// ===== Admin =====
export const useAllTestimonialsAdmin = () => {
  return useQuery({
    queryKey: ["testimonials", "admin", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((t) => t.user_id)));
      let profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        for (const p of profiles || []) {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
        }
      }
      return (data || []).map((t) => ({
        ...t,
        profile: profilesMap.get(t.user_id) || null,
      })) as TestimonialWithProfile[];
    },
  });
};

export const useApproveTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("app_testimonials")
        .update({ approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["testimonials"] }),
  });
};

export const useDeleteTestimonial = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("app_testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["testimonials"] }),
  });
};
