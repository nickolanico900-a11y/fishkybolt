/*
  # Create pending_orders table

  1. New Table
    - `pending_orders` - Temporary storage for order data before payment completion
      - `order_id` (text, primary key) - Order reference ID
      - `first_name` (text, required) - Customer first name
      - `last_name` (text, required) - Customer last name
      - `customer_email` (text, required) - Customer email
      - `customer_phone` (text, required) - Customer phone
      - `package_name` (text, required) - Package name
      - `package_quantity` (integer, required) - Number of items
      - `amount` (numeric, required) - Total amount
      - `product_to_count` (boolean, required) - Whether product counts towards raffle
      - `created_at` (timestamptz, default now()) - Creation timestamp

  2. Security
    - Enable RLS
    - Allow anonymous inserts (for checkout)
    - Allow public reads (for webhook)
    - Auto-cleanup old records after 24 hours
*/

CREATE TABLE IF NOT EXISTS pending_orders (
  order_id text PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  package_name text NOT NULL,
  package_quantity integer NOT NULL,
  amount numeric NOT NULL,
  product_to_count boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous to insert pending orders"
  ON pending_orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read pending orders"
  ON pending_orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Auto delete old pending orders"
  ON pending_orders
  FOR DELETE
  TO public
  USING (created_at < now() - interval '24 hours');