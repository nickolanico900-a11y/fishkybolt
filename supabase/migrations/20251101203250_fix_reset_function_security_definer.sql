/*
  # Fix reset_position_sequence to run as postgres

  1. Changes
    - Recreate function with SECURITY DEFINER
    - This makes function run with postgres privileges
    - Allows service_role to reset sequence via this function
    
  2. Security
    - Only authenticated users can call this function
    - Function only resets sequence, no other operations
*/

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER SEQUENCE sticker_position_seq RESTART WITH 1;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION reset_position_sequence() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_position_sequence() TO service_role;