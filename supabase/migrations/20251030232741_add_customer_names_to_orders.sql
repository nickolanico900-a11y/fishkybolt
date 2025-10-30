/*
  # Add customer names to orders table

  1. Changes
    - Add `first_name` column to orders table
    - Add `last_name` column to orders table
    - Add `paid_at` column to orders table (if not exists)
    - Add `invoice_id` column to orders table (if not exists)
  
  2. Notes
    - These columns store customer names from the checkout form
    - Required for sending accurate confirmation emails
    - paid_at tracks when payment was confirmed
    - invoice_id stores the payment provider's invoice ID
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE orders ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN paid_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN invoice_id text;
  END IF;
END $$;