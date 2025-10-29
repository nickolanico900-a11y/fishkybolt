/*
  # Fix Sequence Reset Permissions

  1. Problem
    - Trigger function cannot ALTER SEQUENCE due to permission restrictions
    - Need to use setval() function instead which doesn't require ownership

  2. Solution
    - Update trigger function to use setval() instead of ALTER SEQUENCE
    - setval() resets the sequence without requiring ownership
    - More secure and works with RLS policies

  3. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS reset_sequence_on_delete ON sticker_entries;
DROP FUNCTION IF EXISTS reset_position_sequence();

-- Create improved function using setval instead of ALTER SEQUENCE
CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if table is now empty after deletion
  IF NOT EXISTS (SELECT 1 FROM sticker_entries LIMIT 1) THEN
    -- Reset the sequence to 1 using setval (more permissive than ALTER SEQUENCE)
    PERFORM setval('sticker_entries_position_number_seq', 1, false);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after DELETE operations
CREATE TRIGGER reset_sequence_on_delete
AFTER DELETE ON sticker_entries
FOR EACH STATEMENT
EXECUTE FUNCTION reset_position_sequence();
