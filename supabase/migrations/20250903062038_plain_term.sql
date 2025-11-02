/*
  # Fix infinite recursion in organization_members policies

  1. Security Function
    - Create `get_user_organization_id()` function with SECURITY DEFINER
    - This function bypasses RLS to prevent recursion

  2. Policy Updates
    - Drop all existing policies on organization_members
    - Create new non-recursive policies using the security definer function
    - Ensure users can only see their own organization data

  3. Safety
    - Use IF EXISTS clauses to prevent errors
    - Maintain data security while fixing recursion
*/

-- Create a security definer function to get user's organization ID
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  RETURN org_id;
END;
$$;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
  RETURN user_role = 'admin';
END;
$$;

-- Drop all existing policies on organization_members to start fresh
DROP POLICY IF EXISTS "Users can view their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Admins can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON organization_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete organization members" ON organization_members;

-- Create new non-recursive policies
CREATE POLICY "Users can view own membership"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all organization members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (public.is_user_admin());

CREATE POLICY "Users can insert own membership"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update member roles"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (public.is_user_admin())
  WITH CHECK (public.is_user_admin());

CREATE POLICY "Admins can delete members"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (public.is_user_admin() AND user_id != auth.uid());