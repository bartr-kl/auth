export type DuprType = 'default' | 'api' | 'self' | 'instructor';
export type UserRole = 'member' | 'staff' | 'admin';

export interface Profile {
  id: number;
  auth_id: string;
  username: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  address: string;
  suite: string | null;
  city: string;
  state: string;
  zip: string;
  dupr_score_singles: number;
  dupr_score_doubles: number;
  dupr_type: DuprType;
  created_at: string;
  updated_at: string;
}

export interface Org {
  id: string;
  name: string;
  description: string | null;
  street: string;
  suite: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  web_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  street: string;
  suite: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  web_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: number;
  user_id: number;
  org_id: string;
  location_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      orgs: {
        Row: Org;
        Insert: Omit<Org, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Org, 'id' | 'created_at' | 'updated_at'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_roles: {
        Row: UserRoleRecord;
        Insert: Omit<UserRoleRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserRoleRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
