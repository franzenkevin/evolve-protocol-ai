import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProtocolFeedback {
  id: string;
  user_id: string;
  protocol_id: string | null;
  protocol_version: number | null;
  rating: number;
  text: string | null;
  admin_notes: string | null;
  admin_email_sent_at: string | null;
  admin_email_subject: string | null;
  created_at: string;
  updated_at: string;
}

export const useProtocolFeedbackForProtocol = (protocolId?: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["protocol-feedback", "mine", protocolId],
    queryFn: async () => {
      if (!user || !protocolId) return null;
      const { data, error } = await supabase
        .from("protocol_feedback")
        .select("*")
        .eq("user_id", user.id)
        .eq("protocol_id", protocolId)
        .maybeSingle();
      if (error) throw error;
      return data as ProtocolFeedback | null;
    },
    enabled: !!user && !!protocolId,
  });
};

export const useSubmitProtocolFeedback = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      protocol_id: string;
      protocol_version: number;
      rating: number;
      text: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("protocol_feedback").upsert(
        {
          user_id: user.id,
          protocol_id: input.protocol_id,
          protocol_version: input.protocol_version,
          rating: input.rating,
          text: input.text || null,
        },
        { onConflict: "user_id,protocol_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["protocol-feedback"] });
    },
  });
};

export interface AdminProtocolFeedbackRow extends ProtocolFeedback {
  profile?: { full_name: string | null; avatar_url: string | null } | null;
  email?: string | null;
}

export const useAdminProtocolFeedback = () => {
  return useQuery({
    queryKey: ["protocol-feedback", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as ProtocolFeedback[];
      // Join profile data
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        (profs || []).forEach((p: any) => {
          profilesMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
      }
      return rows.map((r) => ({ ...r, profile: profilesMap[r.user_id] || null })) as AdminProtocolFeedbackRow[];
    },
  });
};

export const useUpdateAdminFeedbackNotes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes: string }) => {
      const { error } = await supabase
        .from("protocol_feedback")
        .update({ admin_notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocol-feedback", "admin"] }),
  });
};

export const useSendFeedbackEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      to,
      subject,
      message,
    }: {
      id: string;
      to: string;
      subject: string;
      message: string;
    }) => {
      const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
        ${message
          .split("\n")
          .map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`)
          .join("")}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:12px;color:#666">Equipe Evoria</p>
      </div>`;
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { to, subject, html },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Falha ao enviar");

      const { error: updErr } = await supabase
        .from("protocol_feedback")
        .update({ admin_email_sent_at: new Date().toISOString(), admin_email_subject: subject })
        .eq("id", id);
      if (updErr) throw updErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["protocol-feedback", "admin"] }),
  });
};
