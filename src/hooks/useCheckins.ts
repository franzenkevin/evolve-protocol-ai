import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Checkin {
  id: string;
  user_id: string;
  weight: number | null;
  photo_front: string | null;
  photo_side: string | null;
  photo_back: string | null;
  notes: string | null;
  adherence: number | null;
  protocol_id: string | null;
  created_at: string;
}

export const useCheckins = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["checkins", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Checkin[];
    },
    enabled: !!user,
  });
};

export const useCreateCheckin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checkin: Partial<Checkin>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("checkins")
        .insert({ ...checkin, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins", user?.id] });
    },
  });
};

export const uploadPhoto = async (userId: string, file: File, angle: string) => {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}_${angle}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
};
