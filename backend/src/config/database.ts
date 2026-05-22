/**
 * MongoDB — URI from backend/.env, database name default: netmetaura
 */

export type DatabaseConfig = {
  uri: string;
  dbName: string;
};

function stripQuotes(value: string): string {
  const v = value.trim();
  if (
    (v.startsWith("'") && v.endsWith("'")) ||
    (v.startsWith('"') && v.endsWith('"'))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

export function getDatabaseConfig(): DatabaseConfig {
  const uri = stripQuotes(
    process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? "",
  );
  const dbName =
    process.env.MONGODB_DB_NAME?.trim() || "netmetaura";

  return { uri, dbName };
}
