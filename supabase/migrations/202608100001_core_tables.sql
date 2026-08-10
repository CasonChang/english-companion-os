-- English Companion OS: Phase 1 core tables
-- Re-applying this file is safe: objects use IF NOT EXISTS guards and all
-- constraints are declared as part of their guarded table definitions.

create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  session_date date not null,
  start_time time,
  duration_minutes integer,
  topics text[] not null default '{}',
  summary text not null,
  next_session_focus text,
  shadowing jsonb not null default '[]'::jsonb,
  pronunciation_notes jsonb not null default '[]'::jsonb,
  memory_candidates jsonb not null default '[]'::jsonb,
  raw_json jsonb not null,
  schema_version text not null,
  source text not null default 'gpt-live',
  created_at timestamptz not null default now(),
  constraint sessions_duration_minutes_check
    check (duration_minutes is null or duration_minutes between 1 and 240),
  constraint sessions_topics_array_check
    check (cardinality(topics) between 1 and 10),
  constraint sessions_shadowing_array_check
    check (jsonb_typeof(shadowing) = 'array'),
  constraint sessions_pronunciation_notes_array_check
    check (jsonb_typeof(pronunciation_notes) = 'array'),
  constraint sessions_memory_candidates_array_check
    check (jsonb_typeof(memory_candidates) = 'array'),
  constraint sessions_raw_json_object_check
    check (jsonb_typeof(raw_json) = 'object')
);

create unique index if not exists sessions_ingest_identity_idx
  on public.sessions (user_id, session_date, coalesce(start_time, time '00:00'));

create index if not exists sessions_user_date_idx
  on public.sessions (user_id, session_date desc);

create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  type text not null,
  text text not null,
  normalized_text text generated always as (lower(btrim(text))) stored,
  meaning text not null,
  example text not null,
  note text,
  importance text,
  first_session_id uuid references public.sessions (id) on delete set null,
  times_seen integer not null default 1,
  review_level integer not null default 0,
  next_review_at date not null default (current_date + 1),
  last_reviewed_at timestamptz,
  consecutive_good integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_items_type_check check (
    type in (
      'vocabulary',
      'phrase',
      'phrasal_verb',
      'collocation',
      'natural_expression',
      'idiom',
      'pattern'
    )
  ),
  constraint learning_items_text_check check (length(btrim(text)) between 1 and 200),
  constraint learning_items_meaning_check check (length(btrim(meaning)) > 0),
  constraint learning_items_example_check check (length(btrim(example)) > 0),
  constraint learning_items_note_check check (note is null or length(btrim(note)) > 0),
  constraint learning_items_importance_check
    check (importance is null or importance in ('high', 'medium', 'low')),
  constraint learning_items_times_seen_check check (times_seen >= 1),
  constraint learning_items_review_level_check check (review_level between 0 and 5),
  constraint learning_items_consecutive_good_check check (consecutive_good >= 0),
  constraint learning_items_status_check check (status in ('active', 'mastered', 'archived')),
  constraint learning_items_user_type_normalized_key unique (user_id, type, normalized_text)
);

create index if not exists learning_items_due_idx
  on public.learning_items (user_id, status, next_review_at);

create index if not exists learning_items_type_idx
  on public.learning_items (user_id, type);

create table if not exists public.session_learning_items (
  session_id uuid not null references public.sessions (id) on delete cascade,
  learning_item_id uuid not null references public.learning_items (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  example_in_session text,
  primary key (session_id, learning_item_id),
  constraint session_learning_items_example_check
    check (example_in_session is null or length(btrim(example_in_session)) > 0)
);

create index if not exists session_learning_items_user_idx
  on public.session_learning_items (user_id);

create table if not exists public.mistake_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  session_id uuid not null references public.sessions (id) on delete cascade,
  category text not null,
  original text not null,
  corrected text,
  explanation text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  constraint mistake_events_category_check check (
    category in (
      'articles',
      'verb_tense',
      'prepositions',
      'plurals',
      'word_choice',
      'word_order',
      'subject_verb_agreement',
      'unnatural_phrasing',
      'pronunciation',
      'other'
    )
  ),
  constraint mistake_events_original_check check (length(btrim(original)) > 0),
  constraint mistake_events_corrected_check
    check (corrected is null or length(btrim(corrected)) > 0),
  constraint mistake_events_explanation_check
    check (explanation is null or length(btrim(explanation)) > 0)
);

create index if not exists mistake_events_category_idx
  on public.mistake_events (user_id, category, created_at desc);

create index if not exists mistake_events_session_idx
  on public.mistake_events (user_id, session_id);

create table if not exists public.review_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  learning_item_id uuid references public.learning_items (id) on delete cascade,
  mistake_category text,
  channel text not null,
  question_type text not null,
  question text not null,
  user_answer text,
  evaluation text,
  rating text not null,
  created_at timestamptz not null default now(),
  constraint review_events_exactly_one_target_check check (
    (learning_item_id is not null and mistake_category is null)
    or (learning_item_id is null and mistake_category is not null)
  ),
  constraint review_events_mistake_category_check check (
    mistake_category is null
    or mistake_category in (
      'articles',
      'verb_tense',
      'prepositions',
      'plurals',
      'word_choice',
      'word_order',
      'subject_verb_agreement',
      'unnatural_phrasing',
      'pronunciation',
      'other'
    )
  ),
  constraint review_events_channel_check check (channel in ('telegram', 'web')),
  constraint review_events_question_type_check check (
    question_type in (
      'fix_sentence',
      'how_would_you_say',
      'fill_blank',
      'choose_natural',
      'use_in_sentence',
      'rewrite_natural',
      'conversational_reply'
    )
  ),
  constraint review_events_question_check check (length(btrim(question)) > 0),
  constraint review_events_rating_check check (rating in ('again', 'hard', 'good', 'easy'))
);

create index if not exists review_events_item_history_idx
  on public.review_events (user_id, learning_item_id, created_at desc);

create index if not exists review_events_recent_idx
  on public.review_events (user_id, created_at desc);

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  week_start date not null,
  stats jsonb not null,
  narrative text not null,
  suggested_focus text,
  created_at timestamptz not null default now(),
  constraint weekly_reports_week_start_check
    check (extract(isodow from week_start) = 1),
  constraint weekly_reports_stats_object_check
    check (jsonb_typeof(stats) = 'object'),
  constraint weekly_reports_narrative_check check (length(btrim(narrative)) > 0),
  constraint weekly_reports_user_week_key unique (user_id, week_start)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  daily_review_enabled boolean not null default true,
  review_time time not null default '20:30',
  questions_per_review integer not null default 4,
  weekly_report_enabled boolean not null default true,
  weekly_report_day integer not null default 0,
  weekly_report_time time not null default '20:00',
  telegram_chat_id text,
  srs_intervals integer[] not null default '{1,3,7,14,30}',
  agent_name text not null default 'Companion',
  constraint user_settings_timezone_check check (length(btrim(timezone)) > 0),
  constraint user_settings_questions_per_review_check
    check (questions_per_review between 3 and 5),
  constraint user_settings_weekly_report_day_check
    check (weekly_report_day between 0 and 6),
  constraint user_settings_srs_intervals_check check (
    cardinality(srs_intervals) = 5
    and srs_intervals[1] > 0
    and srs_intervals[2] > srs_intervals[1]
    and srs_intervals[3] > srs_intervals[2]
    and srs_intervals[4] > srs_intervals[3]
    and srs_intervals[5] > srs_intervals[4]
  ),
  constraint user_settings_agent_name_check check (length(btrim(agent_name)) > 0)
);
