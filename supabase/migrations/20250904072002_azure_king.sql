/*
  # Add INSERT policy for organizations table

  1. Security Changes
    - Add policy to allow authenticated users to create new organizations
    - This enables the organization setup flow for new users

  2. Notes
    - Users can create organizations but will only see organizations they're members of
    - The existing SELECT policy ensures users only see their own organizations
*/

-- Add policy to allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);