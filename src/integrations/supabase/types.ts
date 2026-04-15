export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_assessments: {
        Row: {
          body_fat_category: string | null
          body_fat_estimate: string | null
          created_at: string
          id: string
          muscle_development: Json | null
          overall_summary: string | null
          photo_paths: string[]
          posture_deviations: string[] | null
          recommendations: string[] | null
          strong_points: string[] | null
          user_id: string
          weak_points: string[] | null
        }
        Insert: {
          body_fat_category?: string | null
          body_fat_estimate?: string | null
          created_at?: string
          id?: string
          muscle_development?: Json | null
          overall_summary?: string | null
          photo_paths?: string[]
          posture_deviations?: string[] | null
          recommendations?: string[] | null
          strong_points?: string[] | null
          user_id: string
          weak_points?: string[] | null
        }
        Update: {
          body_fat_category?: string | null
          body_fat_estimate?: string | null
          created_at?: string
          id?: string
          muscle_development?: Json | null
          overall_summary?: string | null
          photo_paths?: string[]
          posture_deviations?: string[] | null
          recommendations?: string[] | null
          strong_points?: string[] | null
          user_id?: string
          weak_points?: string[] | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          adherence: number | null
          created_at: string
          id: string
          notes: string | null
          photo_back: string | null
          photo_front: string | null
          photo_side: string | null
          protocol_id: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          adherence?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photo_back?: string | null
          photo_front?: string | null
          photo_side?: string | null
          protocol_id?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          adherence?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          photo_back?: string | null
          photo_front?: string | null
          photo_side?: string | null
          protocol_id?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_ratings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          rated_date: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          rated_date?: string
          rating?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          rated_date?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          equipment: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          equipment?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      foods: {
        Row: {
          calories: number
          carbs: number
          category: string | null
          created_at: string
          fat: number
          id: string
          name: string
          protein: number
          updated_at: string
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          fat?: number
          id?: string
          name: string
          protein?: number
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          fat?: number
          id?: string
          name?: string
          protein?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_articles: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          published_at: string
          source_url: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          source_url?: string | null
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          published_at?: string
          source_url?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_meetings: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_url: string | null
          scheduled_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          scheduled_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          scheduled_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string | null
          created_at: string
          disliked_foods: string | null
          experience: string | null
          free_meals: string | null
          full_name: string | null
          goal: string | null
          gym_type: string | null
          height: number | null
          id: string
          injuries: string | null
          meal_count: number | null
          neat: string | null
          onboarding_complete: boolean
          preferred_foods: string[] | null
          sex: string | null
          sleep_hours: number | null
          stress_level: string | null
          supplements: string[] | null
          sweet_preference: string | null
          training_days: number | null
          training_time: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          created_at?: string
          disliked_foods?: string | null
          experience?: string | null
          free_meals?: string | null
          full_name?: string | null
          goal?: string | null
          gym_type?: string | null
          height?: number | null
          id?: string
          injuries?: string | null
          meal_count?: number | null
          neat?: string | null
          onboarding_complete?: boolean
          preferred_foods?: string[] | null
          sex?: string | null
          sleep_hours?: number | null
          stress_level?: string | null
          supplements?: string[] | null
          sweet_preference?: string | null
          training_days?: number | null
          training_time?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string | null
          created_at?: string
          disliked_foods?: string | null
          experience?: string | null
          free_meals?: string | null
          full_name?: string | null
          goal?: string | null
          gym_type?: string | null
          height?: number | null
          id?: string
          injuries?: string | null
          meal_count?: number | null
          neat?: string | null
          onboarding_complete?: boolean
          preferred_foods?: string[] | null
          sex?: string | null
          sleep_hours?: number | null
          stress_level?: string | null
          supplements?: string[] | null
          sweet_preference?: string | null
          training_days?: number | null
          training_time?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      protocols: {
        Row: {
          created_at: string
          diet: Json
          end_date: string
          id: string
          start_date: string
          status: string
          training: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          diet?: Json
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          training?: Json
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          diet?: Json
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          training?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          cashback_amount: number | null
          created_at: string
          id: string
          paid: boolean | null
          referral_code: string
          referred_user_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cashback_amount?: number | null
          created_at?: string
          id?: string
          paid?: boolean | null
          referral_code: string
          referred_user_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cashback_amount?: number | null
          created_at?: string
          id?: string
          paid?: boolean | null
          referral_code?: string
          referred_user_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          next_billing_date: string | null
          payment_brand: string | null
          payment_last4: string | null
          payment_method: string | null
          plan_type: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          next_billing_date?: string | null
          payment_brand?: string | null
          payment_last4?: string | null
          payment_method?: string | null
          plan_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          next_billing_date?: string | null
          payment_brand?: string | null
          payment_last4?: string | null
          payment_method?: string | null
          plan_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          created_at: string
          day_index: number
          exercise_id: string
          exercise_name: string
          id: string
          notes: string | null
          protocol_id: string | null
          session_date: string
          sets: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_index: number
          exercise_id: string
          exercise_name: string
          id?: string
          notes?: string | null
          protocol_id?: string | null
          session_date?: string
          sets?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_index?: number
          exercise_id?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          protocol_id?: string | null
          session_date?: string
          sets?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
