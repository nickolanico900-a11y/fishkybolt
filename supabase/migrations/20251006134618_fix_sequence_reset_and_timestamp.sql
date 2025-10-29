/*
  # Fix Sequence Reset After Deletion and Improve Timestamp

  1. Changes
    - Create a trigger function to automatically reset the position_number sequence when table is empty
    - This ensures new entries start from 1 after database is cleared
    - Update created_at column to include full timestamp with time (already includes time by default)

  2. How it works
    - After any DELETE operation, check if table is empty
    - If empty, reset the sequence to start from 1
    - The created_at column already stores timestamp with timezone (includes date and time)

  3. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Create function to reset sequence when table is empty
CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if table is now empty after deletion
  IF NOT EXISTS (SELECT 1 FROM sticker_entries LIMIT 1) THEN
    -- Reset the sequence to start from 1
    ALTER SEQUENCE sticker_entries_position_number_seq RESTART WITH 1;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS reset_sequence_on_delete ON sticker_entries;

-- Create trigger that fires after DELETE operations
CREATE TRIGGER reset_sequence_on_delete
AFTER DELETE ON sticker_entries
FOR EACH STATEMENT
EXECUTE FUNCTION reset_position_sequence();
