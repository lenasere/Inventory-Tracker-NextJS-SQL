export const unitToTable = {
  foods: "foods",
  drinks: "drinks",
  "cleaning-chemicals": "cleaning_chemicals",
  clothes: "clothes",
  utilities: "utilities",
} as const;

export type UnitKey = keyof typeof unitToTable;

type InventoryPayload = {
  item_name: string;
  unit: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_cost: number;
  notes: string | null;
};

export const isUnitKey = (value: string): value is UnitKey => {
  return value in unitToTable;
};

export const parseId = (value: string): number | null => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

export const parsePayload = (body: unknown): InventoryPayload | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as Record<string, unknown>;
  const itemName = input.item_name;
  const unit = input.unit;
  const quantity = Number(input.quantity_in_stock);
  const reorder = Number(input.reorder_level);
  const unitCost = Number(input.unit_cost);
  const notes = input.notes;

  if (typeof itemName !== "string" || itemName.trim() === "") return null;
  if (typeof unit !== "string" || unit.trim() === "") return null;
  if (!Number.isFinite(quantity) || quantity < 0) return null;
  if (!Number.isFinite(reorder) || reorder < 0) return null;
  if (!Number.isFinite(unitCost) || unitCost < 0) return null;

  return {
    item_name: itemName.trim(),
    unit: unit.trim(),
    quantity_in_stock: Math.floor(quantity),
    reorder_level: Math.floor(reorder),
    unit_cost: Number(unitCost.toFixed(2)),
    notes: typeof notes === "string" && notes.trim() !== "" ? notes.trim() : null,
  };
};
