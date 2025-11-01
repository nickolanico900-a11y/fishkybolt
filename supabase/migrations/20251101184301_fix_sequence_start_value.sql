/*
  # Fix sequence to start from 1 correctly

  1. Changes
    - Recreate sequence to start with 1 and MINVALUE 1
    - Update reset_position_sequence to restart from 1
    - This ensures first entry gets position_number = 1
    
  2. Note
    - After reset, first nextval() returns 1
    - Subsequent calls return 2, 3, 4, etc.
*/

DROP SEQUENCE IF EXISTS sticker_position_seq CASCADE;
CREATE SEQUENCE sticker_position_seq START WITH 1 MINVALUE 1;

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void AS $$
BEGIN
  ALTER SEQUENCE sticker_position_seq RESTART WITH 1;
END;
$$ LANGUAGE plpgsql;

GRANT USAGE ON SEQUENCE sticker_position_seq TO authenticated;
GRANT EXECUTE ON FUNCTION reset_position_sequence() TO authenticated;
