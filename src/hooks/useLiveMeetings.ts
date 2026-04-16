import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LiveMeeting = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  meeting_url: string | null;
  created_at: string;
  updated_at: string;
};

export const useLiveMeetings = () => {
  return useQuery({
    queryKey: ["live-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_meetings")
        .select("*")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as LiveMeeting[];
    },
  });
};

export const useAllMeetings = () =>
  useQuery({
    queryKey: ["meetings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_meetings")
        .select("*")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LiveMeeting[];
    },
  });

export const useCreateMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string | null;
      scheduled_at: string;
      duration_minutes?: number | null;
      meeting_url?: string | null;
    }) => {
      const { data, error } = await supabase.from("live_meetings").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-meetings"] });
      qc.invalidateQueries({ queryKey: ["meetings-all"] });
    },
  });
};

export const useUpdateMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<LiveMeeting> & { id: string }) => {
      const { data, error } = await supabase.from("live_meetings").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-meetings"] });
      qc.invalidateQueries({ queryKey: ["meetings-all"] });
    },
  });
};

export const useDeleteMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-meetings"] });
      qc.invalidateQueries({ queryKey: ["meetings-all"] });
    },
  });
};
