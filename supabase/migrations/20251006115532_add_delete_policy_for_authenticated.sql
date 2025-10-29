/*
  # Add DELETE Policy for Authenticated Users

  1. Changes
    - Add DELETE policy for authenticated users to allow clearing database
    - This allows authenticated admin users to delete entries from the database

  2. Security
    - Only authenticated users can delete entries
    - Anonymous users cannot delete entries
*/

CREATE POLICY "Allow authenticated users to delete entries"
  ON sticker_entries
  FOR DELETE
  TO authenticated
  USING (true);
