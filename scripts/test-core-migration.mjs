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
const ingestMigrationUrl = new URL("../supabase/migrations/202608110001_ingest_session.sql", import.meta.url);
const telegramReviewMigrationUrl = new URL("../supabase/migrations/202608120001_telegram_review.sql", import.meta.url);
const scheduleMigrationUrl = new URL("../supabase/migrations/202608120002_review_schedule.sql", import.meta.url);
const sessionFixtureUrl = new URL("../shared/schemas/examples/session-valid.json", import.meta.url);
const coreMigration = (await readFile(migrationUrl, "utf8")).replace(
  "create extension if not exists pgcrypto;",
  "-- pgcrypto is already provided by the Supabase runtime"
);
const viewsMigration = await readFile(viewsMigrationUrl, "utf8");
const tests = await readFile(testsUrl, "utf8");
const rlsMigration = await readFile(rlsMigrationUrl, "utf8");
const rlsTests = await readFile(rlsTestsUrl, "utf8");
const seed = await readFile(seedUrl, "utf8");
const ingestMigration = await readFile(ingestMigrationUrl, "utf8");
const telegramReviewMigration = await readFile(telegramReviewMigrationUrl, "utf8");
const scheduleMigration = await readFile(scheduleMigrationUrl, "utf8");
const sessionFixture = JSON.parse(await readFile(sessionFixtureUrl, "utf8"));

const db = new PGlite();

try {
  await db.exec(`
    create schema auth;
    create table auth.users (id uuid primary key);
    create role anon;
    create role authenticated;
    create role service_role;
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
  await db.exec(ingestMigration);
  await db.exec(ingestMigration);
  await db.exec(telegramReviewMigration);
  await db.exec(telegramReviewMigration);
  await db.exec(scheduleMigration);
  await db.exec(scheduleMigration);

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
  await db.exec(`insert into auth.users (id) values ('00000000-0000-0000-0000-000000000002')`);
  const firstIngest = await db.query(
    `select public.ingest_english_session($1::uuid, $2::jsonb) as result`,
    ["00000000-0000-0000-0000-000000000002", JSON.stringify(sessionFixture)]
  );
  assert.equal(firstIngest.rows[0].result.duplicate, false);
  assert.equal(firstIngest.rows[0].result.new_items, sessionFixture.learning_items.length);
  const duplicateIngest = await db.query(
    `select public.ingest_english_session($1::uuid, $2::jsonb) as result`,
    ["00000000-0000-0000-0000-000000000002", JSON.stringify(sessionFixture)]
  );
  assert.equal(duplicateIngest.rows[0].result.duplicate, true);
  const ingestCounts = await db.query(`select (select count(*)::integer from sessions where user_id = '00000000-0000-0000-0000-000000000002') sessions, (select count(*)::integer from learning_items where user_id = '00000000-0000-0000-0000-000000000002') items`);
  assert.deepEqual(ingestCounts.rows[0], { sessions: 1, items: sessionFixture.learning_items.length });
  const itemId = await db.query(`select id from learning_items where user_id='00000000-0000-0000-0000-000000000002' limit 1`);
  const saved = await db.query(`select public.save_telegram_review_result($1,$2,null,'how_would_you_say','Question','Answer','Good answer','good') result`,["00000000-0000-0000-0000-000000000002",itemId.rows[0].id]);
  assert.equal(saved.rows[0].result.srs_updated,true);
  const eventId=saved.rows[0].result.event_id;
  const overridden=await db.query(`select public.override_telegram_review_rating($1,$2,'easy') result`,["00000000-0000-0000-0000-000000000002",eventId]);
  assert.equal(overridden.rows[0].result.rating,"easy");
  const eventCount=await db.query(`select count(*)::integer count from review_events where user_id='00000000-0000-0000-0000-000000000002'`);
  assert.equal(eventCount.rows[0].count,1);
  await db.exec(`update user_settings set timezone='UTC',review_time='20:30',last_daily_review_at=null where user_id='00000000-0000-0000-0000-000000000001'`);
  const claim=await db.query(`select public.claim_telegram_review_schedule($1,'2026-08-10T20:35:00Z') result`,['00000000-0000-0000-0000-000000000001']);
  assert.equal(claim.rows[0].result.action,'review');
  const duplicateClaim=await db.query(`select public.claim_telegram_review_schedule($1,'2026-08-10T20:36:00Z') result`,['00000000-0000-0000-0000-000000000001']);
  assert.equal(duplicateClaim.rows[0].result.reason,'already_claimed');
  const settings=await db.query(`select public.update_telegram_review_settings($1,'Asia/Taipei','21:00',true,5) result`,['00000000-0000-0000-0000-000000000001']);
  assert.equal(settings.rows[0].result.question_count,5);
  console.log("PASS migrations, ingest, Telegram review persistence, and schedule claiming verified");
} finally {
  await db.close();
}
