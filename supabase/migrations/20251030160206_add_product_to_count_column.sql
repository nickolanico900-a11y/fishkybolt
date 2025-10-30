/*
  # Add product_to_count column to orders table

  1. Changes
    - Add `product_to_count` boolean column to orders table
    - Default value is false
    - This field determines if the product should be counted in the raffle and generate position numbers
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_to_count boolean DEFAULT false;
