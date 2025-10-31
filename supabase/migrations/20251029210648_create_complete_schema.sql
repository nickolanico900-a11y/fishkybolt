/*
  # Complete Schema Setup for AVTODOM Raffle System

  ## Overview
  This migration creates the complete database schema for the AVTODOM sticker raffle system,
  including entries tracking and timer management.

  ## New Tables

  ### 1. sticker_entries
  Stores all raffle entries from customers who purchase sticker packages.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for each entry
  - `first_name` (text, required) - Customer's first name
  - `last_name` (text, required) - Customer's last name
  - `phone` (text, required) - Customer's phone number
  - `email` (text, required) - Customer's email address
  - `package_name` (text, required) - Name of purchased package
  - `package_price` (numeric, required) - Price paid for package
  - `order_id` (text, required) - Payment system order ID (NOT UNIQUE - allows multiple entries per order)
  - `position_number` (integer, nullable) - Sequential raffle position number
  - `payment_status` (text, default 'pending') - Payment status tracking
  - `transaction_number` (text, nullable) - External transaction reference
  - `created_at` (timestamptz, default now()) - Entry creation timestamp

  ### 2. timer_settings
  Manages the raffle countdown timer and payment acceptance status.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `is_active` (boolean, default true) - Whether payments are currently accepted
  - `end_date` (timestamptz, required) - When the raffle ends
  - `updated_at` (timestamptz, default now()) - Last update timestamp
  - `updated_by` (text, nullable) - Admin who made the last update

  ### 3. orders
  Tracks payment orders and their status.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `order_id` (text, unique, required) - External payment system order ID
  - `amount` (numeric, required) - Order amount
  - `currency` (text, default 'UAH') - Currency code
  - `status` (text, default 'pending') - Order status
  - `customer_email` (text, required) - Customer email
  - `customer_phone` (text, required) - Customer phone
  - `package_name` (text, required) - Package purchased
  - `package_quantity` (integer, default 1) - Number of packages
  - `payment_method` (text, nullable) - Payment method used
  - `error_message` (text, nullable) - Error details if payment failed
  - `created_at` (timestamptz, default now()) - Order creation time
  - `updated_at` (timestamptz, default now()) - Last update time

  ## Security (RLS Policies)

  ### sticker_entries policies:
  1. **Public read access** - Anyone can view entries (for transparency)
  2. **Anonymous insert** - Allows customers to create entries via payment webhooks
  3. **Authenticated update/delete** - Admin access for management

  ### timer_settings policies:
  1. **Public read access** - Anyone can see the timer countdown
  2. **Public update access** - Admin panel is password-protected in the application
  3. **Controlled insert** - Only one settings record can exist

  ### orders policies:
  1. **Anonymous insert** - Allows order creation during checkout
  2. **Public read access** - For order status checking
  3. **Public update access** - For payment webhook updates

  ## Functions and Triggers

  ### Position Number Assignment
  - Trigger automatically assigns sequential position numbers when payment is confirmed
  - Position numbers start at 1 and increment for each successful payment
  - Only assigned when payment_status changes to 'paid'

  ### Reset Sequence Function
  - Allows admin to reset position numbering back to 1
  - Clears all existing position numbers
  - Useful when starting a new raffle period

  ## Initial Data
  - Creates one timer_settings record with 21-day countdown
  - Position sequence starts at 1

  ## Important Notes
  - Order IDs are NOT unique in sticker_entries (multiple entries per order allowed)
  - Timer settings table should only ever have one record
  - All timestamps use UTC timezone
  - Position numbers are assigned automatically via trigger
*/

-- =====================================================
-- STICKER ENTRIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sticker_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  package_name text NOT NULL,
  package_price numeric NOT NULL,
  order_id text NOT NULL,
  position_number integer,
  payment_status text NOT NULL DEFAULT 'pending',
  transaction_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sticker_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read entries" ON sticker_entries;
CREATE POLICY "Anyone can read entries"
  ON sticker_entries
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow anonymous users to insert entries" ON sticker_entries;
CREATE POLICY "Allow anonymous users to insert entries"
  ON sticker_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update entries" ON sticker_entries;
CREATE POLICY "Authenticated users can update entries"
  ON sticker_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete entries" ON sticker_entries;
CREATE POLICY "Authenticated users can delete entries"
  ON sticker_entries
  FOR DELETE
  TO authenticated
  USING (true);

-- Create sequence for position numbers
CREATE SEQUENCE IF NOT EXISTS sticker_position_seq START WITH 1;

-- =====================================================
-- POSITION NUMBER TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION assign_position_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    IF NEW.position_number IS NULL THEN
      NEW.position_number := nextval('sticker_position_seq');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_position_number ON sticker_entries;
CREATE TRIGGER set_position_number
  BEFORE INSERT OR UPDATE ON sticker_entries
  FOR EACH ROW
  EXECUTE FUNCTION assign_position_number();

-- =====================================================
-- RESET SEQUENCE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void AS $$
BEGIN
  UPDATE sticker_entries SET position_number = NULL;
  ALTER SEQUENCE sticker_position_seq RESTART WITH 0;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_position_sequence() TO authenticated;

-- =====================================================
-- TIMER SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS timer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  end_date timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

ALTER TABLE timer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read timer settings" ON timer_settings;
CREATE POLICY "Anyone can read timer settings"
  ON timer_settings
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can update timer settings" ON timer_settings;
CREATE POLICY "Anyone can update timer settings"
  ON timer_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Can insert if no records exist" ON timer_settings;
CREATE POLICY "Can insert if no records exist"
  ON timer_settings
  FOR INSERT
  TO public
  WITH CHECK (NOT EXISTS (SELECT 1 FROM timer_settings));

-- Insert initial timer settings (21 days from now)
INSERT INTO timer_settings (is_active, end_date, updated_at)
VALUES (
  true,
  NOW() + INTERVAL '21 days',
  NOW()
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'UAH',
  status text DEFAULT 'pending',
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  package_name text NOT NULL,
  package_quantity integer DEFAULT 1,
  payment_method text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous to insert orders" ON orders;
CREATE POLICY "Allow anonymous to insert orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
CREATE POLICY "Anyone can read orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
CREATE POLICY "Anyone can update orders"
  ON orders
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);