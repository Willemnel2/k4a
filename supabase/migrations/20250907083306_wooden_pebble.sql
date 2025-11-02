/*
  # Fix RLS policies for clients table

  1. Security Changes
    - Drop existing organization-based policies
    - Add user-based policies for INSERT, SELECT, UPDATE, DELETE
    - Allow users to manage their own clients directly

  2. Changes
    - Users can insert clients with their own user_id
    - Users can view, update, and delete their own clients
    - Remove organization_id requirement for basic client operations
*/

-- Drop existing policies that require organization membership
DROP POLICY IF EXISTS "Users can insert organization clients" ON clients;
DROP POLICY IF EXISTS "Users can view organization clients" ON clients;
DROP POLICY IF EXISTS "Users can update organization clients" ON clients;
DROP POLICY IF EXISTS "Users can delete organization clients" ON clients;

-- Create new user-based policies
CREATE POLICY "Users can insert their own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);