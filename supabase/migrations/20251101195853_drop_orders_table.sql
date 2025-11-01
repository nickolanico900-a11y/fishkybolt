/*
  # Drop orders table

  1. Changes
    - Drop orders table completely as it's not needed
    - System will only use sticker_entries table for raffle participants
*/

DROP TABLE IF EXISTS orders CASCADE;