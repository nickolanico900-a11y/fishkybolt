/*
  # Fix Insert Policy for sticker_entries

  1. Changes
    - Drop existing incorrect INSERT policy
    - Create new INSERT policy that allows anonymous users to insert entries
    - The policy correctly uses WITH CHECK clause to allow insertions
*/

DROP POLICY IF EXISTS "Users can insert their own entries" ON sticker_entries;

CREATE POLICY "Allow anonymous users to insert entries"
  ON sticker_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);
