/*
  # Fix orders table RLS policies

  1. Security Changes
    - Drop existing organization-based policies for orders table
    - Add user-based policies allowing users to manage their own orders
    - Enable INSERT, SELECT, UPDATE, DELETE operations for authenticated users
    - Policies ensure users can only access orders where auth.uid() = user_id

  2. Policy Details
    - INSERT: Users can create orders for themselves
    - SELECT: Users can view their own orders
    - UPDATE: Users can modify their own orders
    - DELETE: Users can delete their own orders
*/

-- Drop existing policies for orders table
DROP POLICY IF EXISTS "Users can delete organization orders" ON orders;
DROP POLICY IF EXISTS "Users can insert organization orders" ON orders;
DROP POLICY IF EXISTS "Users can update organization orders" ON orders;
DROP POLICY IF EXISTS "Users can view organization orders" ON orders;

-- Create new user-based policies for orders table
CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);