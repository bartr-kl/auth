export type UserRole = 'user' | 'staff' | 'admin'
export type DuprType = 'default' | 'api' | 'self' | 'instructor'

export interface Profile {
  id: string
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  address: string | null
  dupr_score_singles: number
  dupr_score_doubles: number
  dupr_type: DuprType
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: UserRole
          address?: string | null
          dupr_score_singles?: number | null
          dupr_score_doubles?: number | null
          dupr_type?: DuprType | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: UserRole
          address?: string | null
          dupr_score_singles?: number | null
          dupr_score_doubles?: number | null
          dupr_type?: DuprType | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      dupr_type: DuprType
    }
  }
}
