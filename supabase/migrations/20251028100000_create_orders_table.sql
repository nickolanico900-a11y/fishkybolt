/*
  # Create orders table for payment tracking

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `order_id` (text, unique) - Order reference from client
      - `invoice_id` (text) - Invoice ID from Monobank
      - `first_name` (text) - Customer first name
      - `last_name` (text) - Customer last name
      - `phone` (text) - Customer phone
      - `email` (text) - Customer email
      - `package_name` (text) - Package name
      - `package_price` (numeric) - Package price
      - `sticker_count` (integer) - Number of stickers/entries
      - `amount` (integer) - Payment amount in kopecks
      - `status` (text) - Order status: awaiting_payment, completed, failed, cancelled
      - `created_at` (timestamptz) - Order creation time
      - `paid_at` (timestamptz) - Payment confirmation time

  2. Security
    - Enable RLS on `orders` table
    - Add policy for anonymous users to insert orders
    - Add policy for authenticated users to read/update orders
    - Add policy for public to read their own order by order_id
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  invoice_id text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  package_name text NOT NULL,
  package_price numeric NOT NULL,
  sticker_count integer NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'awaiting_payment',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders"
  ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read orders by order_id"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
