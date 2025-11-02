/*
  # Sync User Role to JWT Metadata

  1. New Functions
    - Creates a trigger function to sync user role to auth.users app_metadata
    - Ensures role is available in JWT for policy checks

  2. Changes
    - Adds trigger on users table to update auth.users app_metadata when role changes
    - Updates existing users to sync their current roles to JWT
*/

-- Function to sync role to auth.users app_metadata
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync role on insert or update
DROP TRIGGER IF EXISTS sync_user_role_trigger ON users;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- Sync existing users' roles to JWT
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role FROM users LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;
