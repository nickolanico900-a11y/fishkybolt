/*
  # Create sticker_entries table

  1. New Tables
    - `sticker_entries`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `phone` (text)
      - `email` (text)
      - `package_name` (text)
      - `package_price` (numeric)
      - `order_id` (text)
      - `position_number` (integer)
      - `payment_status` (text)
      - `transaction_number` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `sticker_entries` table
    - Add policies for anonymous users to insert entries
    - Add policies for authenticated users to read/update/delete entries
*/

CREATE TABLE IF NOT EXISTS sticker_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  package_name text NOT NULL,
  package_price numeric NOT NULL,
  order_id text UNIQUE NOT NULL,
  position_number integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  transaction_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sticker_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read entries"
  ON sticker_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow anonymous users to insert entries"
  ON sticker_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update entries"
  ON sticker_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete entries"
  ON sticker_entries
  FOR DELETE
  TO authenticated
  USING (true);

CREATE SEQUENCE IF NOT EXISTS sticker_position_seq START WITH 1;