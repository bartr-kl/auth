-- Drop existing admin policies and function if they exist
DROP POLICY IF EXISTS "Admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

DROP POLICY IF EXISTS "Admins can insert any org" ON public.orgs;
DROP POLICY IF EXISTS "Admins can update any org" ON public.orgs;
DROP POLICY IF EXISTS "Admins can delete any org" ON public.orgs;

DROP POLICY IF EXISTS "Admins can insert any location" ON public.locations;
DROP POLICY IF EXISTS "Admins can update any location" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete any location" ON public.locations;

DROP POLICY IF EXISTS "Admins can view any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update any role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete any role" ON public.user_roles;

DROP FUNCTION IF EXISTS public.is_admin();

-- Helper function to check if user is an admin (in any org)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE p.auth_id = auth.uid()
      AND ur.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- PROFILES ADMIN POLICIES
-- =====================

-- Policy: Admins can view any profile
CREATE POLICY "Admins can view any profile"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Policy: Admins can insert any profile
CREATE POLICY "Admins can insert any profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Admins can delete any profile
CREATE POLICY "Admins can delete any profile"
  ON public.profiles
  FOR DELETE
  USING (public.is_admin());

-- =====================
-- ORGS ADMIN POLICIES
-- =====================

-- Policy: Admins can insert any org
CREATE POLICY "Admins can insert any org"
  ON public.orgs
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Admins can update any org
CREATE POLICY "Admins can update any org"
  ON public.orgs
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Admins can delete any org
CREATE POLICY "Admins can delete any org"
  ON public.orgs
  FOR DELETE
  USING (public.is_admin());

-- =====================
-- LOCATIONS ADMIN POLICIES
-- =====================

-- Policy: Admins can insert any location
CREATE POLICY "Admins can insert any location"
  ON public.locations
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Admins can update any location
CREATE POLICY "Admins can update any location"
  ON public.locations
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Admins can delete any location
CREATE POLICY "Admins can delete any location"
  ON public.locations
  FOR DELETE
  USING (public.is_admin());

-- =====================
-- USER_ROLES ADMIN POLICIES
-- =====================

-- Policy: Admins can view any role
CREATE POLICY "Admins can view any role"
  ON public.user_roles
  FOR SELECT
  USING (public.is_admin());

-- Policy: Admins can insert any role
CREATE POLICY "Admins can insert any role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Admins can update any role
CREATE POLICY "Admins can update any role"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Admins can delete any role
CREATE POLICY "Admins can delete any role"
  ON public.user_roles
  FOR DELETE
  USING (public.is_admin());
