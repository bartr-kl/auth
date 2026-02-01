-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_user_role_updated ON public.user_roles;
DROP FUNCTION IF EXISTS public.handle_user_roles_updated_at();
DROP TABLE IF EXISTS public.user_roles;
DROP TYPE IF EXISTS user_role;

-- Create role enum type
CREATE TYPE user_role AS ENUM ('member', 'staff', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id VARCHAR(50) NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  location_id VARCHAR(50) NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure a user can only have one instance of each role per location
  UNIQUE (user_id, org_id, location_id, role)
);

-- Create indexes for faster lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON public.user_roles(org_id);
CREATE INDEX idx_user_roles_location_id ON public.user_roles(location_id);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = (SELECT id FROM public.profiles WHERE auth_id = auth.uid()));

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on role changes
CREATE TRIGGER on_user_role_updated
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_roles_updated_at();

-- Insert sample data for bartr (assumes bartr has profile id 1)
-- Assigns admin and member roles to all locations
INSERT INTO public.user_roles (user_id, org_id, location_id, role)
SELECT
  p.id,
  l.org_id,
  l.id,
  r.role
FROM public.profiles p
CROSS JOIN public.locations l
CROSS JOIN (VALUES ('admin'::user_role), ('member'::user_role)) AS r(role)
WHERE p.username = 'bartr';
