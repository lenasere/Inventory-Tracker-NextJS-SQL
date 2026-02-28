CREATE TABLE IF NOT EXISTS clothes (
  id BIGSERIAL PRIMARY KEY,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity_in_stock INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_name)
);

CREATE INDEX IF NOT EXISTS idx_clothes_item_name ON clothes(item_name);

DROP TRIGGER IF EXISTS trg_clothes_set_updated_at ON clothes;
CREATE TRIGGER trg_clothes_set_updated_at
BEFORE UPDATE ON clothes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
