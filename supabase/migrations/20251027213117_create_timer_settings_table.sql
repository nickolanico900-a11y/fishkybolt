/*
  # Create timer_settings table

  1. New Tables
    - `timer_settings`
      - `id` (uuid, primary key) - unique identifier
      - `is_active` (boolean) - whether timer is active (payments accepted)
      - `end_date` (timestamptz) - timer end date
      - `updated_at` (timestamptz) - last update time
      - `updated_by` (text) - admin email who updated

  2. Security
    - Enable RLS
    - Allow public read access (for displaying timer)
    - Allow public update access (admin panel is password-protected on frontend)

  3. Initial Data
    - Create one record with active timer set to 21 days from now
*/

CREATE TABLE IF NOT EXISTS timer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  end_date timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

ALTER TABLE timer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read timer settings"
  ON timer_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update timer settings"
  ON timer_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Can insert if no records exist"
  ON timer_settings
  FOR INSERT
  TO public
  WITH CHECK (NOT EXISTS (SELECT 1 FROM timer_settings));

INSERT INTO timer_settings (is_active, end_date, updated_at)
VALUES (
  true,
  NOW() + INTERVAL '21 days',
  NOW()
)
ON CONFLICT DO NOTHING;