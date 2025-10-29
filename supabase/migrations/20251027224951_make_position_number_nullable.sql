/*
  # Make position_number nullable for non-raffle products

  1. Changes
    - Change position_number column to allow NULL values
    - Change default value from 0 to NULL
    - Update trigger to only assign position when explicitly requested

  2. Reason
    - Raffle products (stickers) need position numbers for the draw
    - Regular products (filters, lights, etc.) should NOT have position numbers
    - NULL position_number indicates a regular product order
*/

-- Make position_number nullable and change default to NULL
ALTER TABLE sticker_entries 
ALTER COLUMN position_number DROP NOT NULL,
ALTER COLUMN position_number SET DEFAULT NULL;

-- Update the trigger function to only assign position if it's 0 (not NULL)
CREATE OR REPLACE FUNCTION assign_position_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if position_number is 0 (raffle entry)
  -- If it's NULL, keep it NULL (regular product)
  IF NEW.position_number = 0 THEN
    NEW.position_number := nextval('sticker_position_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
