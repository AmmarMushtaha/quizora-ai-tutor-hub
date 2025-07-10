export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_requests: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string
          credits_used: number
          duration_minutes: number | null
          id: string
          image_url: string | null
          pages_count: number | null
          request_type: Database["public"]["Enums"]["ai_request_type"]
          response: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          credits_used: number
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          pages_count?: number | null
          request_type: Database["public"]["Enums"]["ai_request_type"]
          response?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          credits_used?: number
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          pages_count?: number | null
          request_type?: Database["public"]["Enums"]["ai_request_type"]
          response?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      conversation_history: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          total_credits_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title: string
          total_credits_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          total_credits_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          total_credits_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          total_credits_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          total_credits_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          bonus_credits: number | null
          created_at: string
          credits_included: number
          end_date: string
          id: string
          payment_id: string | null
          plan_name: string
          price: number
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string
          credits_included: number
          end_date: string
          id?: string
          payment_id?: string | null
          plan_name: string
          price: number
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string
          credits_included?: number
          end_date?: string
          id?: string
          payment_id?: string | null
          plan_name?: string
          price?: number
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string
          p_credits_to_deduct: number
          p_request_type: Database["public"]["Enums"]["ai_request_type"]
          p_content?: string
          p_response?: string
          p_duration_minutes?: number
          p_pages_count?: number
          p_word_count?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_request_type:
        | "text_question"
        | "image_question"
        | "audio_summary"
        | "mind_map"
        | "chat_explanation"
        | "research_paper"
        | "text_editing"
      subscription_status: "active" | "expired" | "cancelled"
      user_role: "user" | "admin"
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
      ai_request_type: [
        "text_question",
        "image_question",
        "audio_summary",
        "mind_map",
        "chat_explanation",
        "research_paper",
        "text_editing",
      ],
      subscription_status: ["active", "expired", "cancelled"],
      user_role: ["user", "admin"],
    },
  },
} as const
