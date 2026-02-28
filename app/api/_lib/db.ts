import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for API route handlers.");
}

declare global {
  // eslint-disable-next-line no-var
  var __inventoryPool: Pool | undefined;
}

export const pool =
  global.__inventoryPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  global.__inventoryPool = pool;
}
