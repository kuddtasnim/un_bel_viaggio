export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          traveler_type: string | null
          travel_pace: string | null
          bio: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      trips: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          destination: string
          country: string | null
          start_date: string | null
          end_date: string | null
          traveler_type: string | null
          summary: string | null
          is_public: boolean
        }
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['trips']['Insert']>
      }
      reflections: {
        Row: {
          id: string
          created_at: string
          trip_id: string
          user_id: string
          question: string
          answer: string
        }
        Insert: Omit<Database['public']['Tables']['reflections']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reflections']['Insert']>
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          trip_id: string | null
          title: string | null
          content: string | null
          image_url: string | null
          tags: string[]
          mood: string | null
          country: string | null
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          trip_id: string | null
          title: string
          content_ru: string | null
          content_en: string | null
          content_fr: string | null
          original_language: string
          travel_type: string | null
          is_published: boolean
          cover_image_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      itinerary_days: {
        Row: {
          id: string
          trip_id: string
          day_number: number
          title: string | null
          description: string | null
          locations: Json
        }
        Insert: Omit<Database['public']['Tables']['itinerary_days']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['itinerary_days']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
