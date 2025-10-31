/*
  # Fix position number trigger to support 'completed' status

  1. Changes
    - Update trigger function to recognize both 'paid' and 'completed' statuses
    - This ensures position numbers are assigned for both legacy 'paid' and new 'completed' payment statuses
*/

CREATE OR REPLACE FUNCTION assign_position_number()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.payment_status = 'paid' OR NEW.payment_status = 'completed') 
     AND (OLD.payment_status IS NULL OR (OLD.payment_status != 'paid' AND OLD.payment_status != 'completed')) THEN
    IF NEW.position_number IS NULL THEN
      NEW.position_number := nextval('sticker_position_seq');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
