INSERT INTO drinks (
  item_name,
  unit,
  quantity_in_stock,
  reorder_level,
  unit_cost,
  notes
) VALUES (
  $1,
  $2,
  $3,
  $4,
  $5,
  $6
)
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
