/// <reference types="@cloudflare/workers-types" />
import { createClient } from "@libsql/client/http";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export type AppDb = ReturnType<typeof createTursoDb> | ReturnType<typeof createD1Db>;

export function createTursoDb(url: string, authToken?: string) {
  const client = createClient({
    url,
    authToken,
  });

  return drizzleLibsql(client, { schema });
}

export function createD1Db(d1: D1Database) {
  return drizzleD1(d1, { schema });
}
