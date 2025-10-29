/*
  # Додавання номера транзакції до таблиці sticker_entries

  1. Зміни
    - Додається колонка `transaction_number` типу text до таблиці `sticker_entries`
    - Колонка може бути nullable, так як існуючі записи не матимуть номера транзакції
    - Індекс додається для оптимізації пошуку по номеру транзакції
  
  2. Важливо
    - Існуючі записи матимуть `transaction_number` як NULL
    - Нові записи можуть мати номер транзакції або NULL
*/

-- Додаємо колонку transaction_number до таблиці sticker_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sticker_entries' AND column_name = 'transaction_number'
  ) THEN
    ALTER TABLE sticker_entries ADD COLUMN transaction_number text;
  END IF;
END $$;

-- Створюємо індекс для швидкого пошуку по номеру транзакції
CREATE INDEX IF NOT EXISTS idx_sticker_entries_transaction_number ON sticker_entries(transaction_number);