SELECT
  id,
  item_name,
  unit,
  quantity_in_stock,
  reorder_level,
  unit_cost,
  notes,
  created_at,
  updated_at
FROM drinks
ORDER BY item_name ASC;
