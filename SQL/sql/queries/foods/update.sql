UPDATE foods
SET
  item_name = $2,
  unit = $3,
  quantity_in_stock = $4,
  reorder_level = $5,
  unit_cost = $6,
  notes = $7
WHERE id = $1
RETURNING
  id,
  item_name,
  unit,
  quantity_in_stock,
  reorder_level,
  unit_cost,
  notes,
  created_at,
  updated_at;
