INSERT INTO utilities (item_name, unit, quantity_in_stock, reorder_level, unit_cost, notes)
VALUES
  ('Paper Napkins', 'packs', 55, 25, 1.75, 'Front-of-house use'),
  ('Disposable Cups', 'packs', 32, 15, 2.30, 'Takeaway station'),
  ('Fork Set', 'boxes', 20, 10, 4.80, 'Stainless cutlery refill')
ON CONFLICT (item_name) DO UPDATE
SET unit = EXCLUDED.unit,
    quantity_in_stock = EXCLUDED.quantity_in_stock,
    reorder_level = EXCLUDED.reorder_level,
    unit_cost = EXCLUDED.unit_cost,
    notes = EXCLUDED.notes;
