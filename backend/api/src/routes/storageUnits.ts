import { Router } from "express";
import type { Request, Response } from "express";
import { query } from "../db.js";
import { loadSql } from "../lib/sqlLoader.js";

type StorageUnit = {
  route: "foods" | "drinks" | "cleaning-chemicals" | "clothes" | "utilities";
  queryDir:
    | "foods"
    | "drinks"
    | "cleaning_chemicals"
    | "clothes"
    | "utilities";
};

type InventoryRow = {
  id: string;
  item_name: string;
  unit: string;
  quantity_in_stock: string;
  reorder_level: string;
  unit_cost: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DeleteRow = {
  id: string;
};

type ParsedPayload = {
  item_name: string;
  unit: string;
  quantity_in_stock: number;
  reorder_level: number;
  unit_cost: number;
  notes: string | null;
};

const storageUnits: StorageUnit[] = [
  { route: "foods", queryDir: "foods" },
  { route: "drinks", queryDir: "drinks" },
  { route: "cleaning-chemicals", queryDir: "cleaning_chemicals" },
  { route: "clothes", queryDir: "clothes" },
  { route: "utilities", queryDir: "utilities" },
];

const parseId = (rawId: string): number | null => {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

const parsePayload = (body: unknown): ParsedPayload | null => {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = body as Record<string, unknown>;
  const itemName = input.item_name;
  const unit = input.unit;
  const quantity = input.quantity_in_stock;
  const reorder = input.reorder_level;
  const unitCost = input.unit_cost;
  const notesInput = input.notes;

  if (typeof itemName !== "string" || itemName.trim() === "") return null;
  if (typeof unit !== "string" || unit.trim() === "") return null;

  const quantityValue = Number(quantity);
  const reorderValue = Number(reorder);
  const costValue = Number(unitCost);

  if (!Number.isFinite(quantityValue) || quantityValue < 0) return null;
  if (!Number.isFinite(reorderValue) || reorderValue < 0) return null;
  if (!Number.isFinite(costValue) || costValue < 0) return null;

  let notes: string | null = null;
  if (typeof notesInput === "string") {
    notes = notesInput.trim() === "" ? null : notesInput;
  }

  return {
    item_name: itemName.trim(),
    unit: unit.trim(),
    quantity_in_stock: Math.floor(quantityValue),
    reorder_level: Math.floor(reorderValue),
    unit_cost: Number(costValue.toFixed(2)),
    notes,
  };
};

const handleDatabaseError = (res: Response, error: unknown): void => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};

export const storageUnitsRouter = Router();

for (const unit of storageUnits) {
  const listSql = loadSql(`queries/${unit.queryDir}/get_all.sql`);
  const getByIdSql = loadSql(`queries/${unit.queryDir}/get_by_id.sql`);
  const insertSql = loadSql(`queries/${unit.queryDir}/insert.sql`);
  const updateSql = loadSql(`queries/${unit.queryDir}/update.sql`);
  const deleteSql = loadSql(`queries/${unit.queryDir}/delete.sql`);

  storageUnitsRouter.get(`/${unit.route}`, async (_req: Request, res: Response) => {
    try {
      const result = await query<InventoryRow>(listSql);
      res.json({ data: result.rows });
    } catch (error) {
      handleDatabaseError(res, error);
    }
  });

  storageUnitsRouter.get(`/${unit.route}/:id`, async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    try {
      const result = await query<InventoryRow>(getByIdSql, [id]);
      if (result.rowCount === 0) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      res.json({ data: result.rows[0] });
    } catch (error) {
      handleDatabaseError(res, error);
    }
  });

  storageUnitsRouter.post(`/${unit.route}`, async (req: Request, res: Response) => {
    const parsed = parsePayload(req.body);
    if (!parsed) {
      res.status(400).json({
        error:
          "Invalid payload. Required: item_name, unit, quantity_in_stock, reorder_level, unit_cost.",
      });
      return;
    }

    try {
      const result = await query<InventoryRow>(insertSql, [
        parsed.item_name,
        parsed.unit,
        parsed.quantity_in_stock,
        parsed.reorder_level,
        parsed.unit_cost,
        parsed.notes,
      ]);
      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      handleDatabaseError(res, error);
    }
  });

  storageUnitsRouter.put(`/${unit.route}/:id`, async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = parsePayload(req.body);
    if (!parsed) {
      res.status(400).json({
        error:
          "Invalid payload. Required: item_name, unit, quantity_in_stock, reorder_level, unit_cost.",
      });
      return;
    }

    try {
      const result = await query<InventoryRow>(updateSql, [
        id,
        parsed.item_name,
        parsed.unit,
        parsed.quantity_in_stock,
        parsed.reorder_level,
        parsed.unit_cost,
        parsed.notes,
      ]);

      if (result.rowCount === 0) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      handleDatabaseError(res, error);
    }
  });

  storageUnitsRouter.delete(
    `/${unit.route}/:id`,
    async (req: Request, res: Response) => {
      const id = parseId(req.params.id);
      if (!id) {
        res.status(400).json({ error: "Invalid id" });
        return;
      }

      try {
        const result = await query<DeleteRow>(deleteSql, [id]);
        if (result.rowCount === 0) {
          res.status(404).json({ error: "Item not found" });
          return;
        }

        res.status(204).send();
      } catch (error) {
        handleDatabaseError(res, error);
      }
    },
  );
}
