import { NextRequest, NextResponse } from "next/server";
import { getPool } from "../../_lib/db";
import { isUnitKey, parseId, parsePayload, unitToTable } from "../../_lib/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ unit: string; id: string }> },
) {
  const { unit, id: rawId } = await context.params;

  if (!isUnitKey(unit)) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const table = unitToTable[unit];

  try {
    const pool = getPool();
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
      WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ unit: string; id: string }> },
) {
  const { unit, id: rawId } = await context.params;

  if (!isUnitKey(unit)) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
    const pool = getPool();
    const result = await pool.query(
      `
      UPDATE ${table}
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
        updated_at
      `,
      [
        id,
        payload.item_name,
        payload.unit,
        payload.quantity_in_stock,
        payload.reorder_level,
        payload.unit_cost,
        payload.notes,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ unit: string; id: string }> },
) {
  const { unit, id: rawId } = await context.params;

  if (!isUnitKey(unit)) {
    return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
  }

  const id = parseId(rawId);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const table = unitToTable[unit];

  try {
    const pool = getPool();
    const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [
      id,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
