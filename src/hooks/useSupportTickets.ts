import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketWithProfile extends SupportTicket {
  profile?: { full_name: string | null } | null;
}

export const useMyTickets = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["support_tickets", "mine", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SupportTicket[];
    },
    enabled: !!user,
  });
};

export const useCreateTicket = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ subject, message }: { subject: string; message: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          user_email: user.email || "sem-email",
          subject,
          message,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support_tickets"] });
    },
  });
};

// ===== Admin =====
export const useAllTicketsAdmin = () => {
  return useQuery({
    queryKey: ["support_tickets", "admin", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((t) => t.user_id)));
      let profilesMap = new Map<string, { full_name: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        for (const p of profiles || []) {
          profilesMap.set(p.user_id, { full_name: p.full_name });
        }
      }

      return (data || []).map((t) => ({
        ...t,
        profile: profilesMap.get(t.user_id) || null,
      })) as SupportTicketWithProfile[];
    },
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status?: SupportTicket["status"];
      admin_notes?: string;
    }) => {
      const updates: Record<string, any> = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      const { error } = await supabase.from("support_tickets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support_tickets"] }),
  });
};
