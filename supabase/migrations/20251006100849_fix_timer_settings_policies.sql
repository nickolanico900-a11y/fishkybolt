/*
  # Виправлення політик для timer_settings

  1. Зміни
    - Дозволити anon користувачам оновлювати timer_settings
    - Це необхідно для роботи адмін-панелі без аутентифікації
    
  2. Безпека
    - Панель захищена паролем на фронтенді
    - В продакшн варто додати серверну аутентифікацію
*/

-- Видалити стару політику оновлення
DROP POLICY IF EXISTS "Authenticated users can update timer settings" ON timer_settings;

-- Створити нову політику для анонімних користувачів
CREATE POLICY "Anyone can update timer settings"
  ON timer_settings
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Оновити політику вставки також для public
DROP POLICY IF EXISTS "Can insert if no records exist" ON timer_settings;

CREATE POLICY "Can insert if no records exist"
  ON timer_settings
  FOR INSERT
  TO public
  WITH CHECK (NOT EXISTS (SELECT 1 FROM timer_settings));
