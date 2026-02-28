INSERT INTO foods (item_name, unit, quantity_in_stock, reorder_level, unit_cost, notes)
VALUES
  ('Tomatoes', 'kg', 35, 20, 2.10, 'Fresh produce delivery every morning'),
  ('Rice', 'kg', 60, 30, 1.55, 'Dry storage shelf A2'),
  ('Chicken Breast', 'kg', 22, 15, 8.90, 'Keep refrigerated')
ON CONFLICT (item_name) DO UPDATE
SET unit = EXCLUDED.unit,
    quantity_in_stock = EXCLUDED.quantity_in_stock,
    reorder_level = EXCLUDED.reorder_level,
    unit_cost = EXCLUDED.unit_cost,
    notes = EXCLUDED.notes;
