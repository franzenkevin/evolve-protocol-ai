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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          latency_ms: number | null
          metadata: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      app_testimonials: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          rating: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          rating: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          rating?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string
          description: string | null
          discount_percent: number
          id: string
          max_uses: number | null
          updated_at: string
          uses_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          discount_percent: number
          id?: string
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          discount_percent?: number
          id?: string
          max_uses?: number | null
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
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
      diet_feedback: {
        Row: {
          adherence: number
          created_at: string
          digestion: number | null
          energy_level: number | null
          hunger_level: number | null
          id: string
          notes: string | null
          rated_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adherence?: number
          created_at?: string
          digestion?: number | null
          energy_level?: number | null
          hunger_level?: number | null
          id?: string
          notes?: string | null
          rated_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adherence?: number
          created_at?: string
          digestion?: number | null
          energy_level?: number | null
          hunger_level?: number | null
          id?: string
          notes?: string | null
          rated_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          difficulty: string | null
          equipment: string | null
          id: string
          instructions: string | null
          load_type: string | null
          movement_pattern: string | null
          name: string
          primary_muscles: string[] | null
          secondary_muscles: string[] | null
          tempo: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          load_type?: string | null
          movement_pattern?: string | null
          name: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          tempo?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string | null
          equipment?: string | null
          id?: string
          instructions?: string | null
          load_type?: string | null
          movement_pattern?: string | null
          name?: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          tempo?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      food_diary_entries: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          entry_date: string
          fat: number
          fiber: number
          food_id: string | null
          grams: number
          id: string
          meal_label: string | null
          name: string
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          entry_date?: string
          fat?: number
          fiber?: number
          food_id?: string | null
          grams?: number
          id?: string
          meal_label?: string | null
          name: string
          protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          entry_date?: string
          fat?: number
          fiber?: number
          food_id?: string | null
          grams?: number
          id?: string
          meal_label?: string | null
          name?: string
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_diary_entries_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          calories: number
          carbs: number
          category: string | null
          created_at: string
          fat: number
          fiber: number
          id: string
          name: string
          portion_grams: number
          protein: number
          source: string | null
          updated_at: string
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          name: string
          portion_grams?: number
          protein?: number
          source?: string | null
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          fat?: number
          fiber?: number
          id?: string
          name?: string
          portion_grams?: number
          protein?: number
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      journal_articles: {
        Row: {
          ai_generated: boolean
          ai_prompt: string | null
          ai_sources: Json | null
          author: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published_at: string
          read_time_minutes: number | null
          source_url: string | null
          status: string
          summary: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          ai_prompt?: string | null
          ai_sources?: Json | null
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          read_time_minutes?: number | null
          source_url?: string | null
          status?: string
          summary: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          ai_prompt?: string | null
          ai_sources?: Json | null
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published_at?: string
          read_time_minutes?: number | null
          source_url?: string | null
          status?: string
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          converted_user_id: string | null
          created_at: string
          email: string
          goal: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          converted_user_id?: string | null
          created_at?: string
          email: string
          goal?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          converted_user_id?: string | null
          created_at?: string
          email?: string
          goal?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
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
      mobility_exercises: {
        Row: {
          created_at: string
          difficulty: string | null
          duration_seconds: number | null
          equipment: string | null
          id: string
          image_url: string | null
          instructions: string | null
          name: string
          region: string
          reps: number | null
          side: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          duration_seconds?: number | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          name: string
          region: string
          reps?: number | null
          side?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          duration_seconds?: number | null
          equipment?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          name?: string
          region?: string
          reps?: number | null
          side?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      monthly_challenges: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          description: string | null
          id: string
          month_start: string
          reward_points: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          month_start?: string
          reward_points?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          month_start?: string
          reward_points?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_drafts: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          interval_months: number
          name: string
          price_brl: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          interval_months: number
          name: string
          price_brl: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          interval_months?: number
          name?: string
          price_brl?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          ai_data_consent: boolean | null
          ai_data_consent_at: string | null
          allergies: string | null
          avatar_url: string | null
          body_emphasis: string | null
          cardio_duration: string | null
          cardio_enabled: boolean | null
          cardio_frequency: string | null
          cardio_timing: string | null
          cardio_type_preference: string | null
          created_at: string
          current_diet_description: string | null
          disliked_foods: string | null
          disliked_from_list: string | null
          experience: string | null
          extra_activities: string | null
          fasting_window: string | null
          free_meals: string | null
          full_name: string | null
          goal: string | null
          gym_type: string | null
          height: number | null
          id: string
          injuries: string | null
          intermittent_fasting: boolean | null
          meal_count: number | null
          meal_schedule: string | null
          neat: string | null
          onboarding_complete: boolean
          preferred_foods: string[] | null
          sex: string | null
          sleep_hours: number | null
          sleep_time: string | null
          stress_level: string | null
          supplements: string[] | null
          sweet_preference: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          training_days: number | null
          training_time: string | null
          training_weekdays: string[] | null
          updated_at: string
          user_id: string
          wake_time: string | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          ai_data_consent?: boolean | null
          ai_data_consent_at?: string | null
          allergies?: string | null
          avatar_url?: string | null
          body_emphasis?: string | null
          cardio_duration?: string | null
          cardio_enabled?: boolean | null
          cardio_frequency?: string | null
          cardio_timing?: string | null
          cardio_type_preference?: string | null
          created_at?: string
          current_diet_description?: string | null
          disliked_foods?: string | null
          disliked_from_list?: string | null
          experience?: string | null
          extra_activities?: string | null
          fasting_window?: string | null
          free_meals?: string | null
          full_name?: string | null
          goal?: string | null
          gym_type?: string | null
          height?: number | null
          id?: string
          injuries?: string | null
          intermittent_fasting?: boolean | null
          meal_count?: number | null
          meal_schedule?: string | null
          neat?: string | null
          onboarding_complete?: boolean
          preferred_foods?: string[] | null
          sex?: string | null
          sleep_hours?: number | null
          sleep_time?: string | null
          stress_level?: string | null
          supplements?: string[] | null
          sweet_preference?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          training_days?: number | null
          training_time?: string | null
          training_weekdays?: string[] | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          ai_data_consent?: boolean | null
          ai_data_consent_at?: string | null
          allergies?: string | null
          avatar_url?: string | null
          body_emphasis?: string | null
          cardio_duration?: string | null
          cardio_enabled?: boolean | null
          cardio_frequency?: string | null
          cardio_timing?: string | null
          cardio_type_preference?: string | null
          created_at?: string
          current_diet_description?: string | null
          disliked_foods?: string | null
          disliked_from_list?: string | null
          experience?: string | null
          extra_activities?: string | null
          fasting_window?: string | null
          free_meals?: string | null
          full_name?: string | null
          goal?: string | null
          gym_type?: string | null
          height?: number | null
          id?: string
          injuries?: string | null
          intermittent_fasting?: boolean | null
          meal_count?: number | null
          meal_schedule?: string | null
          neat?: string | null
          onboarding_complete?: boolean
          preferred_foods?: string[] | null
          sex?: string | null
          sleep_hours?: number | null
          sleep_time?: string | null
          stress_level?: string | null
          supplements?: string[] | null
          sweet_preference?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          training_days?: number | null
          training_time?: string | null
          training_weekdays?: string[] | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      protocol_feedback: {
        Row: {
          admin_email_sent_at: string | null
          admin_email_subject: string | null
          admin_notes: string | null
          created_at: string
          id: string
          protocol_id: string | null
          protocol_version: number | null
          rating: number
          text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_email_sent_at?: string | null
          admin_email_subject?: string | null
          admin_notes?: string | null
          created_at?: string
          id?: string
          protocol_id?: string | null
          protocol_version?: number | null
          rating: number
          text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_email_sent_at?: string | null
          admin_email_subject?: string | null
          admin_notes?: string | null
          created_at?: string
          id?: string
          protocol_id?: string | null
          protocol_version?: number | null
          rating?: number
          text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocol_milestone_feedbacks: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          diet_notes: string | null
          id: string
          milestone_day: number
          protocol_id: string | null
          requests_notes: string | null
          routine_changes_notes: string | null
          training_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          diet_notes?: string | null
          id?: string
          milestone_day: number
          protocol_id?: string | null
          requests_notes?: string | null
          routine_changes_notes?: string | null
          training_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          diet_notes?: string | null
          id?: string
          milestone_day?: number
          protocol_id?: string | null
          requests_notes?: string | null
          routine_changes_notes?: string | null
          training_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocol_regenerations: {
        Row: {
          amount_brl: number
          created_at: string
          id: string
          status: string
          stripe_session_id: string | null
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          amount_brl?: number
          created_at?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string
          id?: string
          status?: string
          stripe_session_id?: string | null
          updated_at?: string
          used_at?: string | null
          user_id?: string
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
      purchases: {
        Row: {
          amount_brl: number
          buyer_email: string
          buyer_name: string | null
          category: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          product_id: string
          product_label: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_brl?: number
          buyer_email: string
          buyer_name?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          product_id: string
          product_label?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_brl?: number
          buyer_email?: string
          buyer_name?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          product_id?: string
          product_label?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          training_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          training_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          training_time?: string | null
          updated_at?: string
          user_id?: string
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
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount_brl: number | null
          created_at: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_brl?: number | null
          created_at?: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_brl?: number | null
          created_at?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string | null
          id: string
          next_billing_date: string | null
          payment_brand: string | null
          payment_last4: string | null
          payment_method: string | null
          plan_type: string
          price_id: string | null
          product_id: string | null
          start_date: string
          status: string
          stripe_customer_id: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string | null
          id?: string
          next_billing_date?: string | null
          payment_brand?: string | null
          payment_last4?: string | null
          payment_method?: string | null
          plan_type?: string
          price_id?: string | null
          product_id?: string | null
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string | null
          id?: string
          next_billing_date?: string | null
          payment_brand?: string | null
          payment_last4?: string | null
          payment_method?: string | null
          plan_type?: string
          price_id?: string | null
          product_id?: string | null
          start_date?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      workout_feedback: {
        Row: {
          created_at: string
          day_index: number
          id: string
          notes: string | null
          protocol_id: string | null
          rating: number
          session_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_index: number
          id?: string
          notes?: string | null
          protocol_id?: string | null
          rating: number
          session_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_index?: number
          id?: string
          notes?: string | null
          protocol_id?: string | null
          rating?: number
          session_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_feedback_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
        ]
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
      check_ai_rate_limit: {
        Args: {
          _function_name?: string
          _per_day?: number
          _per_hour?: number
          _user_id: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_admin_metrics: { Args: never; Returns: Json }
      get_ai_health_metrics: { Args: never; Returns: Json }
      get_monthly_ranking: {
        Args: { _month_start?: string }
        Returns: {
          avatar_url: string
          checkins_count: number
          is_current_user: boolean
          nickname: string
          rank: number
          total_score: number
          user_id: string
          workouts_count: number
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_coupon: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_percent: number
          valid_until: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
