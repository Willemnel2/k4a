/*
  # Auto-populate public.users table

  This migration creates a trigger that automatically creates a record in the public.users
  table whenever a new user signs up through Supabase Auth.

  1. New Function
    - `handle_new_user()` - Creates a public.users record when auth.users is inserted
  
  2. New Trigger
    - Fires after INSERT on auth.users
    - Calls handle_new_user() function
    
  3. Backfill existing users
    - Inserts any existing auth users into public.users table
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create public.users record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing auth.users into public.users
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
  'user' as role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;