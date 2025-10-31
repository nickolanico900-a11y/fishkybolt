/*
  # Update orders table for Monobank integration

  1. Changes
    - Update any existing references to support Monobank
    - The invoice_id column will now store Monobank transaction references
    - Status values remain compatible: awaiting_payment, completed, failed, cancelled

  2. Notes
    - Monobank uses different status names (success, failure, cancelled)
    - These will be mapped to our existing status values in the webhook handler
    - No schema changes needed - existing structure is compatible
*/

-- Add indexes if they don't exist for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_orders_email'
  ) THEN
    CREATE INDEX idx_orders_email ON orders(customer_email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_orders_created_at'
  ) THEN
    CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
  END IF;
END $$;

-- Add comment to clarify invoice_id usage
COMMENT ON COLUMN orders.invoice_id IS 'Stores payment provider reference: Monobank invoiceId or transaction reference';
