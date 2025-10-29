/*
  # Add error_message column to orders table

  1. Changes
    - Add `error_message` column (text, nullable) to track errors during payment processing
    - This allows storing detailed error information from Monobank API or other payment issues

  2. Purpose
    - Better debugging and customer support
    - Track payment failures and their causes
    - Provide detailed error context to administrators
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE orders ADD COLUMN error_message text;
  END IF;
END $$;