import { NextResponse } from "next/server";
import { pool } from "../_lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await pool.query<{ now: string }>("SELECT now()::text AS now");
    return NextResponse.json({ status: "ok", databaseTime: result.rows[0].now });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
