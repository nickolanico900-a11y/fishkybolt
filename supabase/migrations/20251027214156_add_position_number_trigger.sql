/*
  # Add automatic position number assignment

  1. Changes
    - Create a function to automatically assign position numbers from sequence
    - Create a trigger to call this function before INSERT
    - This ensures each entry gets a unique, sequential position number
  
  2. How it works
    - Before each INSERT, the trigger calls the function
    - The function gets the next value from sticker_position_seq
    - The position_number is automatically assigned to the new entry
*/

-- Create function to assign position number
CREATE OR REPLACE FUNCTION assign_position_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if position_number is 0 (default value)
  IF NEW.position_number = 0 THEN
    NEW.position_number := nextval('sticker_position_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS assign_position_number_trigger ON sticker_entries;

-- Create trigger to automatically assign position numbers
CREATE TRIGGER assign_position_number_trigger
  BEFORE INSERT ON sticker_entries
  FOR EACH ROW
  EXECUTE FUNCTION assign_position_number();