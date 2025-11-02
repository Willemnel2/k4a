/*
  # Add Admin Policies for Clients and Orders Tables

  1. Security Changes
    - Add policies for admin users to view all clients
    - Add policies for admin users to view all orders
    - Existing user policies remain unchanged
    - Only users with 'admin' role can view all data

  This allows administrators to see all clients and orders in the system
  while maintaining existing security for regular users.
*/

-- Add policy for admins to view all clients
CREATE POLICY "Admins can view all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- Add policy for admins to view all orders
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );