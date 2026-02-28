INSERT INTO cleaning_chemicals (item_name, unit, quantity_in_stock, reorder_level, unit_cost, notes)
VALUES
  ('Dish Soap', 'liters', 16, 8, 4.10, 'Biodegradable'),
  ('Sanitizer', 'liters', 12, 6, 6.40, 'Food-safe surface sanitizer'),
  ('Degreaser', 'liters', 9, 4, 7.20, 'Use gloves while handling')
ON CONFLICT (item_name) DO UPDATE
SET unit = EXCLUDED.unit,
    quantity_in_stock = EXCLUDED.quantity_in_stock,
    reorder_level = EXCLUDED.reorder_level,
    unit_cost = EXCLUDED.unit_cost,
    notes = EXCLUDED.notes;
