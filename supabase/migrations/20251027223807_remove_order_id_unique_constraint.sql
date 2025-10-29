/*
  # Remove UNIQUE constraint from order_id column

  1. Changes
    - Remove UNIQUE constraint from `sticker_entries.order_id` column
    - This allows multiple entries to have the same order_id (for products with bonuses)

  2. Reason
    - When purchasing products with bonuses (stickers + bonus), multiple entries are created with the same order_id
    - The UNIQUE constraint prevents this, causing "Failed to create entries" errors
    - Each entry still has a unique id (primary key), so data integrity is maintained
*/

ALTER TABLE sticker_entries 
DROP CONSTRAINT IF EXISTS sticker_entries_order_id_key;
