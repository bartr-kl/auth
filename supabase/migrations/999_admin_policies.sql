-- Drop existing admin policies and function if they exist
DROP POLICY IF EXISTS "Global admins can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "Global admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Global admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Global admins can delete any profile" ON public.profiles;

DROP POLICY IF EXISTS "Global admins can insert any org" ON public.orgs;
DROP POLICY IF EXISTS "Global admins can update any org" ON public.orgs;

DROP POLICY IF EXISTS "Global admins can insert any location" ON public.locations;
DROP POLICY IF EXISTS "Global admins can update any location" ON public.locations;

DROP POLICY IF EXISTS "Global admins can view any role" ON public.user_roles;
DROP POLICY IF EXISTS "Global admins can insert any role" ON public.user_roles;
DROP POLICY IF EXISTS "Global admins can update any role" ON public.user_roles;
DROP POLICY IF EXISTS "Global admins can delete any role" ON public.user_roles;

-- Helper function to check if user is a global admin
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_id = auth.uid()
      AND global_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- =====================
-- PROFILES ADMIN POLICIES
-- =====================

-- Policy: Global admins can view any profile
CREATE POLICY "Global admins can view any profile"
  ON public.profiles
  FOR SELECT
  USING (public.is_global_admin());

-- Policy: Global admins can insert any profile
CREATE POLICY "Global admins can insert any profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.is_global_admin());

-- Policy: Global admins can update any profile
CREATE POLICY "Global admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (public.is_global_admin());

-- Policy: Global admins can delete any profile
CREATE POLICY "Global admins can delete any profile"
  ON public.profiles
  FOR DELETE
  USING (public.is_global_admin());

-- Policy: Global admins can insert any org
CREATE POLICY "Global admins can insert any org"
  ON public.orgs
  FOR INSERT
  WITH CHECK (public.is_global_admin());

-- Policy: Global admins can update any org
CREATE POLICY "Global admins can update any org"
  ON public.orgs
  FOR UPDATE
  USING (public.is_global_admin());

-- =====================
-- LOCATIONS ADMIN POLICIES
-- =====================

-- Policy: Global admins can insert any location
CREATE POLICY "Global admins can insert any location"
  ON public.locations
  FOR INSERT
  WITH CHECK (public.is_global_admin());

-- Policy: Global admins can update any location
CREATE POLICY "Global admins can update any location"
  ON public.locations
  FOR UPDATE
  USING (public.is_global_admin());

-- =====================
-- USER_ROLES ADMIN POLICIES
-- (Only global admins can manage user_roles - avoids recursion)
-- =====================

-- Policy: Global admins can view any role
CREATE POLICY "Global admins can view any role"
  ON public.user_roles
  FOR SELECT
  USING (public.is_global_admin());

-- Policy: Global admins can insert any role
CREATE POLICY "Global admins can insert any role"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_global_admin());

-- Policy: Global admins can update any role
CREATE POLICY "Global admins can update any role"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_global_admin());

-- Policy: Global admins can delete any role
CREATE POLICY "Global admins can delete any role"
  ON public.user_roles
  FOR DELETE
  USING (public.is_global_admin());
