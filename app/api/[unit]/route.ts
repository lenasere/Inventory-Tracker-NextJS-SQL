import { NextRequest, NextResponse } from "next/server";
import { pool } from "../_lib/db";
import { isUnitKey, parsePayload, unitToTable } from "../_lib/inventory";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ unit: string }> },
) {
  const { unit } = await context.params;
  if (!isUnitKey(unit)) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  const table = unitToTable[unit];

  try {
    const result = await pool.query(
      `
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
      FROM ${table}
      ORDER BY item_name ASC
      `,
    );

    return NextResponse.json({ data: result.rows });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ unit: string }> },
) {
  const { unit } = await context.params;
  if (!isUnitKey(unit)) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json(
      {
        error:
          "Invalid payload. Required: item_name, unit, quantity_in_stock, reorder_level, unit_cost.",
      },
      { status: 400 },
    );
  }

  const table = unitToTable[unit];

  try {
    const result = await pool.query(
      `
      INSERT INTO ${table} (
        item_name,
        unit,
        quantity_in_stock,
        reorder_level,
        unit_cost,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        item_name,
        unit,
        quantity_in_stock,
        reorder_level,
        unit_cost,
        notes,
        created_at,
        updated_at
      `,
      [
        payload.item_name,
        payload.unit,
        payload.quantity_in_stock,
        payload.reorder_level,
        payload.unit_cost,
        payload.notes,
      ],
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
