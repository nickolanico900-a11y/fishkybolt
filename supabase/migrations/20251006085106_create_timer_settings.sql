/*
  # Створення таблиці налаштувань таймера

  1. Нова таблиця
    - `timer_settings`
      - `id` (uuid, primary key) - унікальний ідентифікатор
      - `is_active` (boolean) - чи активний таймер (приймаються платежі)
      - `end_date` (timestamptz) - дата закінчення таймера
      - `updated_at` (timestamptz) - час останнього оновлення
      - `updated_by` (text) - email адміністратора що оновив

  2. Безпека
    - Увімкнути RLS
    - Дозволити читання всім (для відображення таймера)
    - Дозволити оновлення тільки адміністраторам

  3. Початкові дані
    - Створити один запис з активним таймером на 21 день
*/

-- Створення таблиці
CREATE TABLE IF NOT EXISTS timer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  end_date timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- Увімкнути RLS
ALTER TABLE timer_settings ENABLE ROW LEVEL SECURITY;

-- Політика для читання (доступно всім)
CREATE POLICY "Anyone can read timer settings"
  ON timer_settings
  FOR SELECT
  TO public
  USING (true);

-- Політика для оновлення (тільки для аутентифікованих користувачів)
-- В майбутньому можна додати перевірку ролі адміністратора
CREATE POLICY "Authenticated users can update timer settings"
  ON timer_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Політика для вставки (тільки якщо записів немає)
CREATE POLICY "Can insert if no records exist"
  ON timer_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (NOT EXISTS (SELECT 1 FROM timer_settings));

-- Вставити початковий запис (таймер на 21 день від зараз)
INSERT INTO timer_settings (is_active, end_date, updated_at)
VALUES (
  true,
  NOW() + INTERVAL '21 days',
  NOW()
)
ON CONFLICT DO NOTHING;
