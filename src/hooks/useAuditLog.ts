import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AuditAction =
  | "export_leads"
  | "export_sales"
  | "promote_admin"
  | "demote_admin"
  | "delete_article"
  | "delete_exercise"
  | "delete_food"
  | "create_food"
  | "update_food"
  | "create_lead"
  | "update_lead"
  | "delete_lead"
  | "create_draft"
  | "publish_article"
  | "update_article"
  | "create_meeting"
  | "update_meeting"
  | "delete_meeting"
  | "create_plan"
  | "update_plan"
  | "delete_plan"
  | "create_coupon"
  | "update_coupon"
  | "delete_coupon"
  | "approve_refund"
  | "deny_refund"
  | "mark_refunded";

export const useLogAudit = () => {
  const { user } = useAuth();
  return useCallback(
    async (action: AuditAction, targetUserId?: string | null, metadata?: Record<string, any>) => {
      if (!user) return;
      // Best-effort: never block the UI if logging fails
      const { error } = await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        action,
        target_user_id: targetUserId ?? null,
        metadata: metadata ?? {},
      });
      if (error) console.warn("[audit] insert failed:", error.message);
    },
    [user],
  );
};

export type AuditLogEntry = {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

export const useAuditLog = (limit = 200) =>
  useQuery({
    queryKey: ["admin-audit-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AuditLogEntry[];
    },
    staleTime: 30 * 1000,
  });
