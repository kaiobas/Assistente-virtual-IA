/**
 * Tipos gerados automaticamente pelo Supabase CLI.
 * Execute: npx supabase gen types typescript --project-id <seu-project-id> > src/types/database.types.ts
 * NUNCA editar esse arquivo manualmente.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          business_id: string
          client_id: string
          professional_id: string
          service_id: string
          scheduled_at: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
      }
      clients: {
        Row: {
          id: string
          business_id: string
          name: string
          phone: string
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      professionals: {
        Row: {
          id: string
          business_id: string
          name: string
          phone: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['professionals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['professionals']['Insert']>
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          duration_min: number
          price: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }
      business: {
        Row: {
          id: string
          name: string
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['business']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['business']['Insert']>
      }
      business_users: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'admin' | 'staff'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['business_users']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          phone: string
          status: 'open' | 'closed' | 'bot'
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          business_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'error' | 'success'
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
