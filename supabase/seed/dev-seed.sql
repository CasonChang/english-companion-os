-- Development data for the dashboard. Safe to re-run.
-- Replace the UUID below with the user UUID shown in Supabase Authentication.
select set_config(
  'app.ecos_user_id',
  '00000000-0000-0000-0000-000000000001',
  false
);

insert into public.user_settings (
  user_id, timezone, agent_name, review_time, questions_per_review
)
values (
  current_setting('app.ecos_user_id')::uuid,
  'Asia/Taipei',
  'Companion',
  '20:30',
  4
)
on conflict (user_id) do nothing;

insert into public.sessions (
  id, user_id, session_date, start_time, duration_minutes, topics, summary,
  next_session_focus, shadowing, pronunciation_notes, memory_candidates,
  raw_json, schema_version
)
values
  (
    '41000000-0000-0000-0000-000000000001',
    current_setting('app.ecos_user_id')::uuid,
    '2026-07-01', '20:10', 28,
    array['weekend plans', 'work routines'],
    'We discussed weekend plans and the routines that make busy workdays manageable. We practiced natural expressions for describing workload and corrected article use around familiar places.',
    'Use articles naturally when talking about familiar places.',
    '["I have a lot on my plate, but I will make time for a break.", "I usually head to the office after breakfast.", "A quiet evening helps me wind down."]'::jsonb,
    '[{"word_or_sound":"routine","note":"Stress the second syllable: rou-TINE."}]'::jsonb,
    '["Usually has busy weekdays and prefers quiet weekends."]'::jsonb,
    '{"schema_version":"1.0","seed":true,"session_label":"work routines"}'::jsonb,
    '1.0'
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    current_setting('app.ecos_user_id')::uuid,
    '2026-07-15', '21:00', 35,
    array['swimming', 'fitness goals'],
    'We talked about swimming practice and building endurance for a longer event. The conversation focused on past-tense storytelling and natural ways to describe effort and recovery.',
    'Tell a complete past-tense story without switching to present tense.',
    '["I pushed through the final lap even though I was exhausted.", "My training is starting to pay off.", "I need to pace myself at the beginning."]'::jsonb,
    '[{"word_or_sound":"exhausted","note":"Keep the final /ɪd/ syllable clear."}]'::jsonb,
    '["Enjoys swimming and is working on endurance."]'::jsonb,
    '{"schema_version":"1.0","seed":true,"session_label":"swimming goals"}'::jsonb,
    '1.0'
  ),
  (
    '41000000-0000-0000-0000-000000000003',
    current_setting('app.ecos_user_id')::uuid,
    '2026-07-29', '20:45', 31,
    array['restaurants', 'catching up with friends'],
    'We practiced telling a friend about a new restaurant and catching up after a long gap. We worked on prepositions, countable nouns, and conversational reactions.',
    'Use follow-up questions to keep a casual conversation moving.',
    '["We finally got around to trying that new restaurant.", "The place lived up to the hype.", "It was great to catch up properly."]'::jsonb,
    '[]'::jsonb,
    '["Likes trying new restaurants with friends."]'::jsonb,
    '{"schema_version":"1.0","seed":true,"session_label":"restaurant catch-up"}'::jsonb,
    '1.0'
  ),
  (
    '41000000-0000-0000-0000-000000000004',
    current_setting('app.ecos_user_id')::uuid,
    '2026-08-08', '21:15', 38,
    array['project deadline', 'weekend recovery'],
    'We caught up about a demanding project deadline and plans to recover over the weekend. We practiced softer ways to complain about work and reviewed recurring verb-tense errors.',
    'Describe a stressful event with consistent past-tense narration.',
    '["I have been swamped, but the project is finally on track.", "We barely met the deadline on Friday.", "I am looking forward to taking it easy this weekend."]'::jsonb,
    '[{"word_or_sound":"deadline","note":"Stress the first syllable: DEAD-line."}]'::jsonb,
    '["Recently completed a stressful project deadline."]'::jsonb,
    '{"schema_version":"1.0","seed":true,"session_label":"project deadline"}'::jsonb,
    '1.0'
  )
on conflict (id) do nothing;

insert into public.learning_items (
  id, user_id, type, text, meaning, example, note, importance,
  first_session_id, times_seen, review_level, next_review_at,
  last_reviewed_at, consecutive_good, status, created_at, updated_at
)
values
  ('42000000-0000-0000-0000-000000000001', current_setting('app.ecos_user_id')::uuid, 'idiom', 'have a lot on my plate', 'to have many responsibilities', 'I have a lot on my plate this week.', 'casual and common at work', 'high', '41000000-0000-0000-0000-000000000001', 3, 3, '2026-08-09', '2026-08-02 12:00+00', 1, 'active', '2026-07-01 12:00+00', '2026-08-02 12:00+00'),
  ('42000000-0000-0000-0000-000000000002', current_setting('app.ecos_user_id')::uuid, 'phrasal_verb', 'wind down', 'to gradually relax after activity', 'I read for a while to wind down.', null, 'medium', '41000000-0000-0000-0000-000000000001', 2, 2, '2026-08-12', '2026-08-05 12:00+00', 1, 'active', '2026-07-01 12:01+00', '2026-08-05 12:00+00'),
  ('42000000-0000-0000-0000-000000000003', current_setting('app.ecos_user_id')::uuid, 'phrase', 'make time for', 'to deliberately reserve time for something', 'I make time for exercise before work.', null, 'medium', '41000000-0000-0000-0000-000000000001', 2, 1, '2026-08-11', '2026-08-08 12:00+00', 1, 'active', '2026-07-01 12:02+00', '2026-08-08 12:00+00'),
  ('42000000-0000-0000-0000-000000000004', current_setting('app.ecos_user_id')::uuid, 'collocation', 'daily routine', 'the activities regularly done each day', 'A short walk is part of my daily routine.', null, 'low', '41000000-0000-0000-0000-000000000001', 1, 0, '2026-08-10', null, 0, 'active', '2026-07-01 12:03+00', '2026-07-01 12:03+00'),
  ('42000000-0000-0000-0000-000000000005', current_setting('app.ecos_user_id')::uuid, 'natural_expression', 'call it a day', 'to stop working for the day', 'Let us call it a day and continue tomorrow.', 'informal', 'medium', '41000000-0000-0000-0000-000000000001', 2, 2, '2026-08-15', '2026-08-08 12:05+00', 1, 'active', '2026-07-01 12:04+00', '2026-08-08 12:05+00'),
  ('42000000-0000-0000-0000-000000000006', current_setting('app.ecos_user_id')::uuid, 'phrasal_verb', 'push through', 'to continue despite difficulty', 'I pushed through the final lap.', null, 'high', '41000000-0000-0000-0000-000000000002', 3, 3, '2026-08-10', '2026-08-03 12:00+00', 1, 'active', '2026-07-15 12:00+00', '2026-08-03 12:00+00'),
  ('42000000-0000-0000-0000-000000000007', current_setting('app.ecos_user_id')::uuid, 'phrasal_verb', 'pay off', 'to produce a good result after effort', 'The extra practice is starting to pay off.', null, 'medium', '41000000-0000-0000-0000-000000000002', 2, 2, '2026-08-14', '2026-08-07 12:00+00', 1, 'active', '2026-07-15 12:01+00', '2026-08-07 12:00+00'),
  ('42000000-0000-0000-0000-000000000008', current_setting('app.ecos_user_id')::uuid, 'phrase', 'pace myself', 'to control effort so energy lasts', 'I need to pace myself early in the race.', null, 'high', '41000000-0000-0000-0000-000000000002', 2, 1, '2026-08-09', '2026-08-06 12:00+00', 0, 'active', '2026-07-15 12:02+00', '2026-08-06 12:00+00'),
  ('42000000-0000-0000-0000-000000000009', current_setting('app.ecos_user_id')::uuid, 'collocation', 'build endurance', 'to improve the ability to exercise for longer', 'Long swims help me build endurance.', null, 'medium', '41000000-0000-0000-0000-000000000002', 2, 2, '2026-08-20', '2026-08-06 12:01+00', 1, 'active', '2026-07-15 12:03+00', '2026-08-06 12:01+00'),
  ('42000000-0000-0000-0000-000000000010', current_setting('app.ecos_user_id')::uuid, 'vocabulary', 'exhausted', 'extremely tired', 'I was exhausted after the swim.', 'stronger than tired', 'medium', '41000000-0000-0000-0000-000000000002', 3, 5, '2026-09-05', '2026-08-06 12:02+00', 2, 'mastered', '2026-07-15 12:04+00', '2026-08-06 12:02+00'),
  ('42000000-0000-0000-0000-000000000011', current_setting('app.ecos_user_id')::uuid, 'phrasal_verb', 'get around to', 'to finally do something delayed', 'We got around to trying the new restaurant.', null, 'high', '41000000-0000-0000-0000-000000000003', 2, 1, '2026-08-10', '2026-08-07 13:00+00', 1, 'active', '2026-07-29 13:00+00', '2026-08-07 13:00+00'),
  ('42000000-0000-0000-0000-000000000012', current_setting('app.ecos_user_id')::uuid, 'idiom', 'live up to the hype', 'to be as good as people claim', 'The restaurant lived up to the hype.', 'often used for films, places, and products', 'medium', '41000000-0000-0000-0000-000000000003', 1, 0, '2026-08-10', null, 0, 'active', '2026-07-29 13:01+00', '2026-07-29 13:01+00'),
  ('42000000-0000-0000-0000-000000000013', current_setting('app.ecos_user_id')::uuid, 'phrasal_verb', 'catch up', 'to exchange news after time apart', 'It was great to catch up with Mia.', 'catch up with someone', 'high', '41000000-0000-0000-0000-000000000003', 3, 3, '2026-08-18', '2026-08-04 13:00+00', 1, 'active', '2026-07-29 13:02+00', '2026-08-04 13:00+00'),
  ('42000000-0000-0000-0000-000000000014', current_setting('app.ecos_user_id')::uuid, 'natural_expression', 'the place was packed', 'the place was very crowded', 'The place was packed on Friday night.', 'casual', 'medium', '41000000-0000-0000-0000-000000000003', 1, 0, '2026-08-10', null, 0, 'active', '2026-07-29 13:03+00', '2026-07-29 13:03+00'),
  ('42000000-0000-0000-0000-000000000015', current_setting('app.ecos_user_id')::uuid, 'collocation', 'make a reservation', 'to arrange a table in advance', 'We should make a reservation for Saturday.', null, 'low', '41000000-0000-0000-0000-000000000003', 1, 1, '2026-08-13', '2026-08-10 13:00+00', 1, 'active', '2026-07-29 13:04+00', '2026-08-10 13:00+00'),
  ('42000000-0000-0000-0000-000000000016', current_setting('app.ecos_user_id')::uuid, 'natural_expression', 'I am swamped', 'a natural way to say extremely busy', 'I am swamped at work this week.', 'casual; common with colleagues', 'high', '41000000-0000-0000-0000-000000000004', 3, 2, '2026-08-09', '2026-08-06 14:00+00', 1, 'active', '2026-08-08 14:00+00', '2026-08-08 14:00+00'),
  ('42000000-0000-0000-0000-000000000017', current_setting('app.ecos_user_id')::uuid, 'collocation', 'meet a deadline', 'to finish work by the required time', 'We barely met the deadline on Friday.', 'meet, not catch, a deadline', 'high', '41000000-0000-0000-0000-000000000004', 3, 3, '2026-08-10', '2026-08-03 14:00+00', 1, 'active', '2026-08-08 14:01+00', '2026-08-08 14:01+00'),
  ('42000000-0000-0000-0000-000000000018', current_setting('app.ecos_user_id')::uuid, 'phrase', 'on track', 'progressing as planned', 'The project is finally back on track.', null, 'medium', '41000000-0000-0000-0000-000000000004', 2, 1, '2026-08-11', '2026-08-08 14:02+00', 1, 'active', '2026-08-08 14:02+00', '2026-08-08 14:02+00'),
  ('42000000-0000-0000-0000-000000000019', current_setting('app.ecos_user_id')::uuid, 'idiom', 'take it easy', 'to relax and avoid too much effort', 'I am going to take it easy this weekend.', null, 'medium', '41000000-0000-0000-0000-000000000004', 2, 1, '2026-08-11', '2026-08-08 14:03+00', 1, 'active', '2026-08-08 14:03+00', '2026-08-08 14:03+00'),
  ('42000000-0000-0000-0000-000000000020', current_setting('app.ecos_user_id')::uuid, 'pattern', 'I have been + -ing', 'a pattern for an activity continuing until now', 'I have been working late all week.', 'present perfect continuous', 'high', '41000000-0000-0000-0000-000000000004', 2, 0, '2026-08-10', null, 0, 'active', '2026-08-08 14:04+00', '2026-08-08 14:04+00'),
  ('42000000-0000-0000-0000-000000000021', current_setting('app.ecos_user_id')::uuid, 'phrase', 'look forward to', 'to feel pleased about a future event', 'I look forward to resting this weekend.', 'follow with a noun or -ing form', 'medium', '41000000-0000-0000-0000-000000000004', 2, 2, '2026-08-15', '2026-08-08 14:05+00', 1, 'active', '2026-08-08 14:05+00', '2026-08-08 14:05+00'),
  ('42000000-0000-0000-0000-000000000022', current_setting('app.ecos_user_id')::uuid, 'natural_expression', 'barely made it', 'succeeded with almost no time or margin left', 'We barely made it before closing time.', 'informal', 'low', '41000000-0000-0000-0000-000000000004', 1, 0, '2026-08-10', null, 0, 'active', '2026-08-08 14:06+00', '2026-08-08 14:06+00'),
  ('42000000-0000-0000-0000-000000000023', current_setting('app.ecos_user_id')::uuid, 'collocation', 'heavy workload', 'a large amount of work', 'The team has a heavy workload this month.', null, 'medium', '41000000-0000-0000-0000-000000000004', 1, 0, '2026-08-10', null, 0, 'active', '2026-08-08 14:07+00', '2026-08-08 14:07+00'),
  ('42000000-0000-0000-0000-000000000024', current_setting('app.ecos_user_id')::uuid, 'vocabulary', 'manageable', 'possible to handle without too much difficulty', 'The workload feels manageable now.', null, 'low', '41000000-0000-0000-0000-000000000004', 1, 0, '2026-08-10', null, 0, 'active', '2026-08-08 14:08+00', '2026-08-08 14:08+00'),
  ('42000000-0000-0000-0000-000000000025', current_setting('app.ecos_user_id')::uuid, 'phrasal_verb', 'follow through', 'to complete something you promised to do', 'I need to follow through on my plan.', 'follow through on/with something', 'high', '41000000-0000-0000-0000-000000000004', 2, 1, '2026-08-11', '2026-08-08 14:09+00', 1, 'active', '2026-08-08 14:09+00', '2026-08-08 14:09+00')
on conflict (id) do nothing;

insert into public.session_learning_items (
  session_id, learning_item_id, user_id, example_in_session
)
select
  case
    when item_number <= 5 then '41000000-0000-0000-0000-000000000001'::uuid
    when item_number <= 10 then '41000000-0000-0000-0000-000000000002'::uuid
    when item_number <= 15 then '41000000-0000-0000-0000-000000000003'::uuid
    else '41000000-0000-0000-0000-000000000004'::uuid
  end,
  ('42000000-0000-0000-0000-' || lpad(item_number::text, 12, '0'))::uuid,
  current_setting('app.ecos_user_id')::uuid,
  example
from (
  select
    row_number() over (order by id)::integer as item_number,
    example
  from public.learning_items
  where user_id = current_setting('app.ecos_user_id')::uuid
    and id::text like '42000000-0000-0000-0000-%'
) as seeded_items
on conflict (session_id, learning_item_id) do nothing;

insert into public.mistake_events (
  id, user_id, session_id, category, original, corrected, explanation,
  is_recurring, created_at
)
values
  ('43000000-0000-0000-0000-000000000001', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000001', 'articles', 'I went to office early.', 'I went to the office early.', 'Use the for a familiar specific place.', false, '2026-07-01 12:20+00'),
  ('43000000-0000-0000-0000-000000000002', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000001', 'verb_tense', 'Yesterday I work until nine.', 'Yesterday I worked until nine.', 'Use past tense with yesterday.', false, '2026-07-01 12:21+00'),
  ('43000000-0000-0000-0000-000000000003', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000001', 'prepositions', 'I relax in the weekend.', 'I relax on the weekend.', 'Use on the weekend in American English.', false, '2026-07-01 12:22+00'),
  ('43000000-0000-0000-0000-000000000004', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000001', 'articles', 'I am at office now.', 'I am at the office now.', 'A familiar workplace normally takes the.', true, '2026-07-01 12:23+00'),
  ('43000000-0000-0000-0000-000000000005', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000001', 'unnatural_phrasing', 'My work is very many.', 'I have a lot of work.', 'Use have a lot of work for workload.', false, '2026-07-01 12:24+00'),
  ('43000000-0000-0000-0000-000000000006', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000002', 'verb_tense', 'I swim five laps yesterday.', 'I swam five laps yesterday.', 'Swim has the irregular past form swam.', false, '2026-07-15 13:20+00'),
  ('43000000-0000-0000-0000-000000000007', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000002', 'word_choice', 'I made a strong exercise.', 'I did an intense workout.', 'Workout is the natural noun here.', false, '2026-07-15 13:21+00'),
  ('43000000-0000-0000-0000-000000000008', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000002', 'subject_verb_agreement', 'The training help me.', 'The training helps me.', 'Singular training takes helps.', false, '2026-07-15 13:22+00'),
  ('43000000-0000-0000-0000-000000000009', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000002', 'verb_tense', 'I did not swam fast.', 'I did not swim fast.', 'Use the base verb after did not.', true, '2026-07-15 13:23+00'),
  ('43000000-0000-0000-0000-000000000010', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000002', 'pronunciation', 'exhausted', 'exhausted', 'Keep the final syllable audible.', false, '2026-07-15 13:24+00'),
  ('43000000-0000-0000-0000-000000000011', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000003', 'plurals', 'We ordered two dish.', 'We ordered two dishes.', 'A number greater than one needs a plural noun.', false, '2026-07-29 13:20+00'),
  ('43000000-0000-0000-0000-000000000012', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000003', 'prepositions', 'I met with her in Friday.', 'I met her on Friday.', 'Use on with days of the week.', false, '2026-07-29 13:21+00'),
  ('43000000-0000-0000-0000-000000000013', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000003', 'word_order', 'I very liked the dessert.', 'I really liked the dessert.', 'Put really before the main verb.', false, '2026-07-29 13:22+00'),
  ('43000000-0000-0000-0000-000000000014', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000003', 'articles', 'Restaurant was crowded.', 'The restaurant was crowded.', 'Use the for the restaurant already being discussed.', true, '2026-07-29 13:23+00'),
  ('43000000-0000-0000-0000-000000000015', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000003', 'unnatural_phrasing', 'We talked many things.', 'We talked about a lot of things.', 'Talk needs about before the topic.', false, '2026-07-29 13:24+00'),
  ('43000000-0000-0000-0000-000000000016', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000004', 'verb_tense', 'I did not went home.', 'I did not go home.', 'Use the base verb after did not.', true, '2026-08-08 14:20+00'),
  ('43000000-0000-0000-0000-000000000017', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000004', 'articles', 'We finished project.', 'We finished the project.', 'Use the for the specific shared project.', true, '2026-08-08 14:21+00'),
  ('43000000-0000-0000-0000-000000000018', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000004', 'prepositions', 'I am looking forward for resting.', 'I am looking forward to resting.', 'The expression is look forward to.', false, '2026-08-08 14:22+00'),
  ('43000000-0000-0000-0000-000000000019', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000004', 'subject_verb_agreement', 'The deadlines makes me stressed.', 'The deadlines make me stressed.', 'Plural deadlines take make.', false, '2026-08-08 14:23+00'),
  ('43000000-0000-0000-0000-000000000020', current_setting('app.ecos_user_id')::uuid, '41000000-0000-0000-0000-000000000004', 'unnatural_phrasing', 'My stress became down.', 'My stress eased up.', 'Eased up is a natural way to describe reduced stress.', false, '2026-08-08 14:24+00')
on conflict (id) do nothing;

insert into public.review_events (
  id, user_id, learning_item_id, channel, question_type, question,
  user_answer, evaluation, rating, created_at
)
values
  ('44000000-0000-0000-0000-000000000001', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000001', 'telegram', 'how_would_you_say', 'How would you say you have many responsibilities?', 'I have a lot on my plate.', 'Natural and correct.', 'good', '2026-07-08 12:00+00'),
  ('44000000-0000-0000-0000-000000000002', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000002', 'web', 'fill_blank', 'I read to ____ down.', 'wind', 'Correct.', 'good', '2026-07-12 12:00+00'),
  ('44000000-0000-0000-0000-000000000003', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000006', 'telegram', 'use_in_sentence', 'Use push through in a sentence.', 'I pushed through the last lap.', 'Natural use.', 'good', '2026-07-22 12:00+00'),
  ('44000000-0000-0000-0000-000000000004', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000008', 'telegram', 'how_would_you_say', 'How do you say you control your effort?', 'I pace myself.', 'Correct idea with missing context.', 'hard', '2026-07-24 12:00+00'),
  ('44000000-0000-0000-0000-000000000005', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000010', 'web', 'use_in_sentence', 'Use exhausted in a sentence.', 'I was exhausted after swimming.', 'Natural and correct.', 'easy', '2026-07-30 12:00+00'),
  ('44000000-0000-0000-0000-000000000006', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000013', 'telegram', 'fill_blank', 'It was great to ____ up.', 'catch', 'Correct.', 'good', '2026-08-02 12:00+00'),
  ('44000000-0000-0000-0000-000000000007', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000016', 'telegram', 'how_would_you_say', 'How would you say you are extremely busy?', 'I am swamped.', 'Exactly right.', 'easy', '2026-08-06 12:00+00'),
  ('44000000-0000-0000-0000-000000000008', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000017', 'web', 'choose_natural', 'Meet or catch a deadline?', 'Meet a deadline.', 'Correct collocation.', 'good', '2026-08-08 12:00+00'),
  ('44000000-0000-0000-0000-000000000009', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000018', 'telegram', 'fill_blank', 'The project is back ____ track.', 'in', 'The expected preposition is on.', 'again', '2026-08-09 12:00+00'),
  ('44000000-0000-0000-0000-000000000010', current_setting('app.ecos_user_id')::uuid, '42000000-0000-0000-0000-000000000025', 'web', 'use_in_sentence', 'Use follow through in a sentence.', 'I will follow through my plan.', 'Almost; use follow through on my plan.', 'hard', '2026-08-10 12:00+00')
on conflict (id) do nothing;

insert into public.weekly_reports (
  id, user_id, week_start, stats, narrative, suggested_focus
)
values
  (
    '45000000-0000-0000-0000-000000000001',
    current_setting('app.ecos_user_id')::uuid,
    '2026-07-27',
    '{"minutes":31,"sessions":1,"new_items":5,"reviews_done":2,"top_mistakes":["articles","prepositions"]}'::jsonb,
    'You completed one focused session and added five useful expressions. Article use is becoming more consistent, while prepositions still need deliberate attention.',
    'Prepositions in everyday time and place expressions.'
  ),
  (
    '45000000-0000-0000-0000-000000000002',
    current_setting('app.ecos_user_id')::uuid,
    '2026-08-03',
    '{"minutes":38,"sessions":1,"new_items":10,"reviews_done":4,"top_mistakes":["verb_tense","articles"]}'::jsonb,
    'You handled work-related vocabulary naturally and completed four reviews. Past-tense narration is still the clearest opportunity for improvement.',
    'Tell complete past-tense stories without switching tense.'
  )
on conflict (id) do nothing;

select
  (select count(*) from public.sessions where user_id = current_setting('app.ecos_user_id')::uuid) as sessions,
  (select count(*) from public.learning_items where user_id = current_setting('app.ecos_user_id')::uuid) as learning_items,
  (select count(*) from public.mistake_events where user_id = current_setting('app.ecos_user_id')::uuid) as mistakes,
  (select count(*) from public.review_events where user_id = current_setting('app.ecos_user_id')::uuid) as reviews;
