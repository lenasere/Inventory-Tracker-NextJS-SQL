INSERT INTO clothes (item_name, unit, quantity_in_stock, reorder_level, unit_cost, notes)
VALUES
  ('Chef Apron', 'pieces', 25, 10, 12.50, 'Black cotton apron'),
  ('Kitchen Gloves', 'pairs', 40, 20, 3.20, 'Heat-resistant gloves'),
  ('Server Uniform Shirt', 'pieces', 18, 10, 14.00, 'Mixed sizes')
ON CONFLICT (item_name) DO UPDATE
SET unit = EXCLUDED.unit,
    quantity_in_stock = EXCLUDED.quantity_in_stock,
    reorder_level = EXCLUDED.reorder_level,
    unit_cost = EXCLUDED.unit_cost,
    notes = EXCLUDED.notes;
