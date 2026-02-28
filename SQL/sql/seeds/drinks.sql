INSERT INTO drinks (item_name, unit, quantity_in_stock, reorder_level, unit_cost, notes)
VALUES
  ('Sparkling Water', 'bottles', 80, 40, 0.85, 'High turnover'),
  ('Orange Juice', 'liters', 18, 15, 2.20, 'Cold room storage'),
  ('Coffee Beans', 'kg', 14, 12, 11.50, 'Specialty roast')
ON CONFLICT (item_name) DO UPDATE
SET unit = EXCLUDED.unit,
    quantity_in_stock = EXCLUDED.quantity_in_stock,
    reorder_level = EXCLUDED.reorder_level,
    unit_cost = EXCLUDED.unit_cost,
    notes = EXCLUDED.notes;
