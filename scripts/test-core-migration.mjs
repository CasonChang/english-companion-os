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
const rlsMigrationUrl = new URL(
  "../supabase/migrations/202608100003_rls.sql",
  import.meta.url
);
const rlsTestsUrl = new URL("../supabase/rls-tests.sql", import.meta.url);
const seedUrl = new URL("../supabase/seed/dev-seed.sql", import.meta.url);
const coreMigration = (await readFile(migrationUrl, "utf8")).replace(
  "create extension if not exists pgcrypto;",
  "-- pgcrypto is already provided by the Supabase runtime"
);
const viewsMigration = await readFile(viewsMigrationUrl, "utf8");
const tests = await readFile(testsUrl, "utf8");
const rlsMigration = await readFile(rlsMigrationUrl, "utf8");
const rlsTests = await readFile(rlsTestsUrl, "utf8");
const seed = await readFile(seedUrl, "utf8");

const db = new PGlite();

try {
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create role anon;
    create role authenticated;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
  `);
  await db.exec(coreMigration);
  await db.exec(coreMigration);
  await db.exec(viewsMigration);
  await db.exec(viewsMigration);
  await db.exec(rlsMigration);
  await db.exec(rlsMigration);

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
  await db.exec(rlsTests);
  await db.exec(`
    insert into auth.users (id)
    values ('00000000-0000-0000-0000-000000000001')
    on conflict (id) do nothing
  `);
  await db.exec(seed);
  await db.exec(seed);
  const seedCounts = await db.query(`
    select
      (select count(*)::integer from public.sessions) as sessions,
      (select count(*)::integer from public.learning_items) as learning_items,
      (select count(*)::integer from public.mistake_events) as mistakes,
      (select count(*)::integer from public.review_events) as reviews
  `);
  assert.deepEqual(seedCounts.rows[0], {
    sessions: 4,
    learning_items: 25,
    mistakes: 20,
    reviews: 10
  });
  console.log("PASS migrations, SRS, RLS, and idempotent 4-session seed verified");
} finally {
  await db.close();
}
