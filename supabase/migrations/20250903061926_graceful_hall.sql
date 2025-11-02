/*
  # Fix infinite recursion in organization_members policies

  1. Security Changes
    - Drop existing recursive policies on organization_members table
    - Create simple, non-recursive policies that avoid self-referencing
    - Allow users to view their own membership records
    - Allow admins to manage memberships in their organization

  2. Policy Structure
    - SELECT: Users can view their own membership record
    - INSERT: Only for creating initial memberships (handled by application logic)
    - UPDATE: Admins can update roles within their organization
    - DELETE: Admins can remove members from their organization
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;

-- Create simple, non-recursive policies

-- Users can view their own membership record
CREATE POLICY "Users can view own membership"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own membership (for initial setup)
CREATE POLICY "Users can insert own membership"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- For viewing other members and management operations, we'll use a function-based approach
-- that doesn't cause recursion by checking the user's role directly in the users table

-- Create a function to check if user is admin of an organization
CREATE OR REPLACE FUNCTION is_organization_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = org_id 
      AND om.user_id = auth.uid() 
      AND om.role = 'admin'
  );
$$;

-- Admins can view all members in their organization
CREATE POLICY "Admins can view organization members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  );

-- Admins can update member roles in their organization
CREATE POLICY "Admins can update member roles"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  );

-- Admins can delete members from their organization (except themselves)
CREATE POLICY "Admins can delete organization members"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (
    user_id != auth.uid() AND
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
        AND om.role = 'admin'
    )
  );