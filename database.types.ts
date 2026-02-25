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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_text: string
          created_at: string
          id: number
          latitude: number
          longitude: number
          name: string
          user_id: string
        }
        Insert: {
          address_text: string
          created_at?: string
          id?: number
          latitude: number
          longitude: number
          name: string
          user_id: string
        }
        Update: {
          address_text?: string
          created_at?: string
          id?: number
          latitude?: number
          longitude?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      album_posts: {
        Row: {
          bookmark_id: string
          caption: string | null
          created_at: string
          id: string
          image_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookmark_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookmark_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_posts_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
        ]
      }
      album_photos: {
        Row: {
          bookmark_id: string
          caption: string | null
          created_at: string
          id: string
          image_path: string
          updated_at: string | null
        }
        Insert: {
          bookmark_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_path: string
          updated_at?: string | null
        }
        Update: {
          bookmark_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_path?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "album_photos_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: false
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmark_items: {
        Row: {
          bookmark_id: string
          created_at: string
          id: string
          place_id: string
          sort_order: number
          visit_time: string | null
        }
        Insert: {
          bookmark_id: string
          created_at?: string
          id?: string
          place_id: string
          sort_order: number
          visit_time?: string | null
        }
        Update: {
          bookmark_id?: string
          created_at?: string
          id?: string
          place_id?: string
          sort_order?: number
          visit_time?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          area: string | null
          cover_image_path: string | null
          created_at: string
          id: string
          title: string
          travel_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          cover_image_path?: string | null
          created_at?: string
          id?: string
          title: string
          travel_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          cover_image_path?: string | null
          created_at?: string
          id?: string
          title?: string
          travel_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          cached_address_text: string | null
          cached_name: string | null
          google_place_id: string
          latitude: number
          longitude: number
          primary_type: string | null
        }
        Insert: {
          cached_address_text?: string | null
          cached_name?: string | null
          google_place_id: string
          latitude: number
          longitude: number
          primary_type?: string | null
        }
        Update: {
          cached_address_text?: string | null
          cached_name?: string | null
          google_place_id?: string
          latitude?: number
          longitude?: number
          primary_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          selected_address_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          selected_address_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          selected_address_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_selected_address_id_fkey"
            columns: ["selected_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
