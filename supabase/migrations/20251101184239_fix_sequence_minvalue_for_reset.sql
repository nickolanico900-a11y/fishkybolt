/*
  # Fix sequence minvalue for proper reset

  1. Changes
    - Drop and recreate sticker_position_seq with MINVALUE 0
    - Update reset_position_sequence to restart from 0
    - This ensures first entry gets position_number = 1
    
  2. Note
    - Sequence starting at 0 will give 1 on first nextval()
    - Subsequent calls give 2, 3, 4, etc.
*/

DROP SEQUENCE IF EXISTS sticker_position_seq CASCADE;
CREATE SEQUENCE sticker_position_seq START WITH 1 MINVALUE 0;

CREATE OR REPLACE FUNCTION reset_position_sequence()
RETURNS void AS $$
BEGIN
  ALTER SEQUENCE sticker_position_seq RESTART WITH 0;
END;
$$ LANGUAGE plpgsql;

GRANT USAGE ON SEQUENCE sticker_position_seq TO authenticated;
GRANT EXECUTE ON FUNCTION reset_position_sequence() TO authenticated;
