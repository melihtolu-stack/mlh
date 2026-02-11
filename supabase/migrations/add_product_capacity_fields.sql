-- Add container capacity fields to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS units_per_carton INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cartons_per_pallet INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pallets_per_20ft INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pallets_per_40ft INTEGER DEFAULT 0;
