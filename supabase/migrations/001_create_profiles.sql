-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP TABLE IF EXISTS public.profiles;
DROP TYPE IF EXISTS dupr_type;

-- Create custom types for roles and DUPR types
CREATE TYPE dupr_type AS ENUM ('default', 'api', 'self', 'instructor');

-- Create profiles table
CREATE TABLE public.profiles (
  id SERIAL PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  suite TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  dupr_score_singles DECIMAL(5,3) DEFAULT 2.0 NOT NULL CHECK (dupr_score_singles >= 2.0 AND dupr_score_singles <= 8.0),
  dupr_score_doubles DECIMAL(5,3) DEFAULT 2.0 NOT NULL CHECK (dupr_score_doubles >= 2.0 AND dupr_score_doubles <= 8.0),
  dupr_type dupr_type DEFAULT 'default' NOT NULL,
  global_admin BOOLEAN DEFAULT FALSE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = auth_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on profile changes
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

update public.profiles
  set username = 'bartr',
      first_name = 'Bart',
      last_name = 'Robertson',
      address = '10417 Brimfield Drive',
      city = 'Austin',
      state = 'TX',
      zip = '78726',
      phone = '512-417-0000',
      dupr_score_doubles = 3.024,
      dupr_score_singles = 2.911,
      dupr_type = 'api',
      global_admin = true
where email = 'bartr@outlook.com';

select * from profiles;
