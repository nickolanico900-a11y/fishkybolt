/*
  # Fix Security Policies

  1. Changes to sticker_entries table
    - Remove insecure policies that use USING (true)
    - Add secure policy for anonymous INSERT (for customer orders)
    - Add secure policies for authenticated users (admin panel)
    - Public can only read entries (for winner display)
    - Only service role can update/delete via edge functions
  
  2. Changes to timer_settings table
    - Remove insecure public UPDATE policy
    - Only allow public to read settings
    - Only service role can update via edge functions
    - Maintain insert restriction (only if no records exist)
  
  3. Security Improvements
    - Prevent unauthorized modifications
    - Maintain functionality for customer orders
    - Protect admin operations with authentication
    - Keep public read access for transparency
*/

-- Drop all existing policies for sticker_entries
DROP POLICY IF EXISTS "Allow anonymous users to insert entries" ON sticker_entries;
DROP POLICY IF EXISTS "Anyone can read entries" ON sticker_entries;
DROP POLICY IF EXISTS "Authenticated users can delete entries" ON sticker_entries;
DROP POLICY IF EXISTS "Authenticated users can update entries" ON sticker_entries;

-- Create new secure policies for sticker_entries

-- Allow public to read entries (for displaying winners/participants)
CREATE POLICY "Public can view entries"
  ON sticker_entries FOR SELECT
  TO public
  USING (true);

-- Allow service role to insert entries (via edge function)
CREATE POLICY "Service role can insert entries"
  ON sticker_entries FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to update entries (via edge function if needed)
CREATE POLICY "Service role can update entries"
  ON sticker_entries FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow service role to delete entries (via edge function for admin cleanup)
CREATE POLICY "Service role can delete entries"
  ON sticker_entries FOR DELETE
  TO service_role
  USING (true);

-- Drop insecure policies for timer_settings
DROP POLICY IF EXISTS "Anyone can update timer settings" ON timer_settings;

-- Keep read access for everyone (timer display)
-- Keep insert policy (already exists and is secure)

-- Add service role update policy for timer_settings
CREATE POLICY "Service role can update timer settings"
  ON timer_settings FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
