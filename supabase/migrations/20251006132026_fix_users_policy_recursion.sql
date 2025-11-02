/*
  # Fix Infinite Recursion in Users Table Policy

  1. Changes
    - Drop the problematic admin policy that causes infinite recursion
    - Create a helper function to check admin status using auth.jwt()
    - Recreate admin policy using the helper function instead of querying users table

  2. Security
    - Maintains admin ability to view all users
    - Eliminates infinite recursion by checking JWT metadata instead of querying users table
    - All other policies remain unchanged
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create a helper function to check if user is admin using JWT
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate admin policy using the helper function
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());
