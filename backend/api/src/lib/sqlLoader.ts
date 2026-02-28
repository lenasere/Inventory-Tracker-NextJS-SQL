import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sqlBaseDir = path.resolve(currentDir, "../../sql");
const sqlCache = new Map<string, string>();

export const loadSql = (relativePath: string): string => {
  const normalizedPath = relativePath.replace(/^\/+/, "");

  if (sqlCache.has(normalizedPath)) {
    return sqlCache.get(normalizedPath) as string;
  }

  const fullPath = path.join(sqlBaseDir, normalizedPath);
  const sql = readFileSync(fullPath, "utf8");
  sqlCache.set(normalizedPath, sql);
  return sql;
};
