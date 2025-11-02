/*
  # Initial Schema for Client Order Management System

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Client name
      - `email` (text) - Client email address
      - `phone` (text) - Client phone number
      - `address` (text) - Installation address
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `client_id` (uuid, references clients table)
      - `title` (text) - Order title/name
      - `description` (text) - Detailed description
      - `status` (enum) - Order status (pending, confirmed, in_progress, completed, cancelled)
      - `order_date` (date) - When order was placed
      - `installation_date` (date) - Calculated installation date
      - `lead_time_days` (integer) - Number of days from order to installation
      - `total_amount` (decimal) - Order total amount
      - `notes` (text) - Additional notes
      - `reminder_sent` (boolean) - Whether email reminder was sent
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own clients and orders

  3. Indexes
    - Add indexes for common query patterns
    - Foreign key relationships
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  order_date date NOT NULL,
  installation_date date NOT NULL,
  lead_time_days integer NOT NULL DEFAULT 14,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients table
CREATE POLICY "Users can view their own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- Create RLS policies for orders table
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(email);
CREATE INDEX IF NOT EXISTS clients_name_idx ON clients(name);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_client_id_idx ON orders(client_id);
CREATE INDEX IF NOT EXISTS orders_installation_date_idx ON orders(installation_date);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_reminder_sent_idx ON orders(reminder_sent);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();