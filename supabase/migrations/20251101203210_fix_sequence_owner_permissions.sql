/*
  # Fix sequence permissions for service_role

  1. Changes
    - Change owner of sequence to postgres (superuser)
    - Grant ALL permissions on sequence to service_role
    - This allows service_role to ALTER SEQUENCE (restart it)
    
  2. Security
    - service_role already has full access via RLS bypass
    - This is needed for reset_position_sequence() to work from Edge Functions
*/

ALTER SEQUENCE sticker_position_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE sticker_position_seq TO service_role;
GRANT USAGE ON SEQUENCE sticker_position_seq TO authenticated;
GRANT USAGE ON SEQUENCE sticker_position_seq TO anon;