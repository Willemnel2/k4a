/*
  # Add Admin Policy for Users Table

  1. Security
    - Add policy for admin users to view all registered users
    - Existing user policies remain unchanged
    - Only users with 'admin' role can view all users

  This allows administrators to see all registered users in the system
  while maintaining existing security for regular users.
*/

-- Add policy for admins to view all users
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );