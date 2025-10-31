/*
  # Fix reset_position_sequence to work after deletion

  1. Changes
    - Update reset_position_sequence to only reset the sequence counter
    - Remove the UPDATE statement that sets position_number to NULL
    - This function is called after DELETE, so there are no records to update
    - Next insert will correctly start from position 1
*/

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void AS $$
BEGIN
  ALTER SEQUENCE sticker_position_seq RESTART WITH 0;
END;
$$ LANGUAGE plpgsql;
