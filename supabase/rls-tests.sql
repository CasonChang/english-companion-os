-- RLS smoke tests for anonymous, authenticated-own, cross-user, and web writes.
-- Run after all migrations. Everything is rolled back.

begin;

insert into auth.users (id)
values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into public.user_settings (user_id, agent_name)
values
  ('00000000-0000-0000-0000-000000000001', 'Owner Companion'),
  ('00000000-0000-0000-0000-000000000002', 'Foreign Companion')
on conflict (user_id) do nothing;

insert into public.sessions (
  id, user_id, session_date, topics, summary, raw_json, schema_version
)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    current_date,
    array['rls test'],
    'Owner session',
    '{}'::jsonb,
    '1.0'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    current_date,
    array['rls test'],
    'Foreign session',
    '{}'::jsonb,
    '1.0'
  )
on conflict (id) do nothing;

insert into public.learning_items (
  id, user_id, type, text, meaning, example, next_review_at
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'phrase',
    'owner phrase',
    'Owner meaning',
    'Owner example.',
    current_date
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'phrase',
    'foreign phrase',
    'Foreign meaning',
    'Foreign example.',
    current_date
  )
on conflict (id) do nothing;

-- No JWT: every base table and invoker-security view must be empty.
set local role anon;

do $$
begin
  assert (select count(*) from public.sessions) = 0, 'anon sessions must be empty';
  assert (select count(*) from public.learning_items) = 0, 'anon items must be empty';
  assert (select count(*) from public.session_learning_items) = 0, 'anon joins must be empty';
  assert (select count(*) from public.mistake_events) = 0, 'anon mistakes must be empty';
  assert (select count(*) from public.review_events) = 0, 'anon reviews must be empty';
  assert (select count(*) from public.weekly_reports) = 0, 'anon reports must be empty';
  assert (select count(*) from public.user_settings) = 0, 'anon settings must be empty';
  assert (select count(*) from public.v_weekly_activity) = 0, 'anon activity view must be empty';
  assert (select count(*) from public.v_mistake_category_stats) = 0, 'anon mistake view must be empty';
  assert (select count(*) from public.v_due_reviews) = 0, 'anon due view must be empty';
end;
$$;

reset role;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);
set local role authenticated;

-- The signed-in user sees their row and never the foreign user's row.
do $$
begin
  assert (select count(*) from public.sessions) = 1, 'owner must see one session';
  assert (select count(*) from public.learning_items) = 1, 'owner must see one item';
  assert (select count(*) from public.user_settings) = 1, 'owner must see one settings row';
  assert not exists (
    select 1 from public.sessions
    where user_id = '00000000-0000-0000-0000-000000000002'
  ), 'foreign session must be hidden';
  assert (select count(*) from public.v_due_reviews) = 1, 'due view must inherit RLS';
end;
$$;

-- The web client may append its own web review for its own item.
insert into public.review_events (
  user_id, learning_item_id, channel, question_type, question, rating
)
values (
  '00000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'web',
  'use_in_sentence',
  'Use the owner phrase in a sentence.',
  'good'
);

-- Telegram writes and references to another user's item must be rejected.
do $$
begin
  begin
    insert into public.review_events (
      user_id, learning_item_id, channel, question_type, question, rating
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      'telegram',
      'use_in_sentence',
      'This must fail.',
      'good'
    );
    assert false, 'authenticated browser must not insert Telegram reviews';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.review_events (
      user_id, learning_item_id, channel, question_type, question, rating
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000002',
      'web',
      'use_in_sentence',
      'This must also fail.',
      'good'
    );
    assert false, 'browser must not review another user item';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

-- Settings updates affect only the authenticated user's row.
update public.user_settings
set agent_name = 'Updated Companion';

do $$
begin
  assert (select agent_name from public.user_settings) = 'Updated Companion',
    'owner settings update must succeed';
end;
$$;

reset role;

do $$
begin
  assert (
    select agent_name from public.user_settings
    where user_id = '00000000-0000-0000-0000-000000000002'
  ) = 'Foreign Companion', 'foreign settings must remain unchanged';
end;
$$;

rollback;
