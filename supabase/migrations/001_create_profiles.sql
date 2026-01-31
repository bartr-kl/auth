-- =============================================================================
-- PaddleStack Admin Dashboard - Database Setup
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- Create custom types for roles and DUPR types
CREATE TYPE user_role AS ENUM ('user', 'staff', 'admin');
CREATE TYPE dupr_type AS ENUM ('api', 'self', 'instructor');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  address TEXT,
  dupr_score_singles DECIMAL(4,2) CHECK (dupr_score_singles >= 2.0 AND dupr_score_singles <= 8.0),
  dupr_score_doubles DECIMAL(4,2) CHECK (dupr_score_doubles >= 2.0 AND dupr_score_doubles <= 8.0),
  dupr_type dupr_type,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Row Level Security Policies
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Staff and Admins can view all profiles
CREATE POLICY "Staff and admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('staff', 'admin')
    )
  );

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      -- If not staff/admin, can't change their role
      (SELECT role FROM public.profiles WHERE id = auth.uid()) NOT IN ('staff', 'admin')
      OR role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Staff can update user profiles (but not admin profiles or promote to admin)
CREATE POLICY "Staff can update user profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'staff'
    )
    AND role = 'user'
  )
  WITH CHECK (role IN ('user', 'staff'));

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Allow insert for new users (handled by trigger)
CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins and Staff can insert profiles (for creating users)
CREATE POLICY "Staff and admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('staff', 'admin')
    )
  );

-- =============================================================================
-- Trigger to auto-create profile on signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Trigger to update updated_at timestamp
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- Create indexes for better query performance
-- =============================================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);

-- =============================================================================
-- Optional: Create your first admin user
-- After running this migration, sign up with an email/password,
-- then run this query to make yourself an admin:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'your-email@example.com';
-- =============================================================================
