/*
  # Fix DB clear sequence reset

  1. Changes
    - Update reset_position_sequence to restart sequence from 0
    - This ensures the first entry gets position_number = 1 (0 + 1)
    - Subsequent entries get 2, 3, 4, etc.
    
  2. Note
    - PostgreSQL sequence with RESTART WITH 0 will give 1 on first nextval()
*/

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void AS $$
BEGIN
  ALTER SEQUENCE sticker_position_seq RESTART WITH 0;
END;
$$ LANGUAGE plpgsql;
