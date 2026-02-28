
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __inventoryPool: Pool | undefined;
}

export const getPool = (): Pool => {
  if (global.__inventoryPool) {
    return global.__inventoryPool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for API route handlers.");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  if (process.env.NODE_ENV !== "production") {
    global.__inventoryPool = pool;
  }

  return pool;
};
