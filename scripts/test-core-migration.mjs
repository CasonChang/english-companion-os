import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";

const migrationUrl = new URL(
  "../supabase/migrations/202608100001_core_tables.sql",
  import.meta.url
);
const migration = (await readFile(migrationUrl, "utf8")).replace(
  "create extension if not exists pgcrypto;",
  "-- pgcrypto is already provided by the Supabase runtime"
);

const db = new PGlite();

try {
  await db.exec("create schema auth; create table auth.users (id uuid primary key);");
  await db.exec(migration);
  await db.exec(migration);

  const expectedTables = [
    "learning_items",
    "mistake_events",
    "review_events",
    "session_learning_items",
    "sessions",
    "user_settings",
    "weekly_reports"
  ];
  const result = await db.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `);

  assert.deepEqual(
    result.rows.map(({ table_name: tableName }) => tableName),
    expectedTables
  );
  console.log("PASS core migration applied twice and created all seven tables");
} finally {
  await db.close();
}
