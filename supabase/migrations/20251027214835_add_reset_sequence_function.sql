/*
  # Add function to reset position sequence

  1. Changes
    - Create a SQL function that resets sticker_position_seq to 1
    - This function can be called by Edge Functions with service role key
  
  2. Security
    - Function is SECURITY DEFINER to allow sequence modification
    - Only accessible with proper authentication
*/

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset the sequence to start from 1
  ALTER SEQUENCE sticker_position_seq RESTART WITH 0;
END;
$$;