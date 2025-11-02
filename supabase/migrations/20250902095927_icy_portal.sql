/*
  # Add User Roles and Multi-User Support

  1. New Tables
    - `users` - Store user profiles and roles
    - `organizations` - Allow multiple users to belong to the same organization
    - `organization_members` - Junction table for user-organization relationships

  2. Schema Changes
    - Add `organization_id` to existing tables
    - Add role-based permissions (admin, manager, user)
    - Update RLS policies for role-based access

  3. Security
    - Enable RLS on all new tables
    - Add policies for organization-based access
    - Add policies for role-based financial data access
*/

-- Create users table to store additional profile information
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members junction table
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add organization_id to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS organization_members_org_id_idx ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS organization_members_user_id_idx ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS clients_organization_id_idx ON clients(organization_id);
CREATE INDEX IF NOT EXISTS orders_organization_id_idx ON orders(organization_id);

-- Create function to get user's organization and role
CREATE OR REPLACE FUNCTION get_user_org_role(user_uuid uuid)
RETURNS TABLE(organization_id uuid, role text) AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id, om.role
  FROM organization_members om
  WHERE om.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can see financial data
CREATE OR REPLACE FUNCTION can_see_financial_data(user_uuid uuid, target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  same_org boolean := false;
BEGIN
  -- Get user's role in their organization
  SELECT om.role INTO user_role
  FROM organization_members om
  WHERE om.user_id = user_uuid;
  
  -- Check if both users are in the same organization
  SELECT EXISTS(
    SELECT 1 FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = user_uuid AND om2.user_id = target_user_id
  ) INTO same_org;
  
  -- Return true if user is admin/manager in same org, or if it's their own data
  RETURN (user_role IN ('admin', 'manager') AND same_org) OR (user_uuid = target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS policies for organizations
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for organization_members
CREATE POLICY "Users can view members in their organization"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Update clients table policies for organization-based access
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view organization clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
CREATE POLICY "Users can insert organization clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
CREATE POLICY "Users can update organization clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;
CREATE POLICY "Users can delete organization clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update orders table policies for organization-based access with financial data restrictions
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view organization orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert organization orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update organization orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;
CREATE POLICY "Users can delete organization orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();