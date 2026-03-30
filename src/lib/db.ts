import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/schema";
import { env } from "@/lib/env";

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

function getClient() {
  if (!client) {
    client = postgres(env.DATABASE_URL, { prepare: false });
  }
  return client;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof PostgresJsDatabase<typeof schema>];
  },
});

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    dbInstance = null;
  }
}
