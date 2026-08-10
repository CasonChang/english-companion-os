import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { PGlite } from "@electric-sql/pglite";

const migrationUrl = new URL(
  "../supabase/migrations/202608100001_core_tables.sql",
  import.meta.url
);
const viewsMigrationUrl = new URL(
  "../supabase/migrations/202608100002_views_and_srs.sql",
  import.meta.url
);
const testsUrl = new URL("../supabase/tests.sql", import.meta.url);
const coreMigration = (await readFile(migrationUrl, "utf8")).replace(
  "create extension if not exists pgcrypto;",
  "-- pgcrypto is already provided by the Supabase runtime"
);
const viewsMigration = await readFile(viewsMigrationUrl, "utf8");
const tests = await readFile(testsUrl, "utf8");

const db = new PGlite();

try {
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create role authenticated;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
  `);
  await db.exec(coreMigration);
  await db.exec(coreMigration);
  await db.exec(viewsMigration);
  await db.exec(viewsMigration);

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
      and table_type = 'BASE TABLE'
    order by table_name
  `);

  assert.deepEqual(
    result.rows.map(({ table_name: tableName }) => tableName),
    expectedTables
  );
  const viewResult = await db.query(`
    select table_name
    from information_schema.views
    where table_schema = 'public'
    order by table_name
  `);
  assert.deepEqual(
    viewResult.rows.map(({ table_name: tableName }) => tableName),
    ["v_due_reviews", "v_mistake_category_stats", "v_weekly_activity"]
  );
  await db.exec(tests);
  console.log("PASS migrations applied twice; seven tables, views, and SRS transitions verified");
} finally {
  await db.close();
}
