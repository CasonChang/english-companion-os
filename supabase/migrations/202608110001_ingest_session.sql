-- Atomic, idempotent Hermes ingestion entry point. Validation happens in Hermes
-- before this function is called; database constraints remain the final guard.
create or replace function public.ingest_english_session(p_user_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_item_id uuid;
  v_item jsonb;
  v_correction jsonb;
  v_recurring jsonb;
  v_example jsonb;
  v_new_items integer := 0;
  v_seen_items integer := 0;
  v_corrections integer := 0;
  v_recurring_events integer := 0;
  v_start_time time := nullif(p_payload->>'session_start_time', '')::time;
begin
  if p_payload->>'schema_version' <> '1.0' then
    raise exception 'unsupported schema_version';
  end if;

  select id into v_session_id
  from public.sessions
  where user_id = p_user_id
    and session_date = (p_payload->>'session_date')::date
    and coalesce(start_time, time '00:00') = coalesce(v_start_time, time '00:00');

  if v_session_id is not null then
    return jsonb_build_object('duplicate', true, 'session_id', v_session_id);
  end if;

  insert into public.sessions (
    user_id, session_date, start_time, duration_minutes, topics, summary,
    next_session_focus, shadowing, pronunciation_notes, memory_candidates,
    raw_json, schema_version
  ) values (
    p_user_id, (p_payload->>'session_date')::date, v_start_time,
    nullif(p_payload->>'duration_minutes', '')::integer,
    array(select jsonb_array_elements_text(p_payload->'topics')),
    p_payload->>'session_summary', p_payload->>'next_session_focus',
    p_payload->'shadowing', p_payload->'pronunciation_notes',
    p_payload->'memory_candidates', p_payload, p_payload->>'schema_version'
  ) returning id into v_session_id;

  for v_item in select value from jsonb_array_elements(p_payload->'learning_items') loop
    select id into v_item_id from public.learning_items
    where user_id = p_user_id and type = v_item->>'type'
      and normalized_text = lower(btrim(v_item->>'text'));

    if v_item_id is null then
      insert into public.learning_items (
        user_id, type, text, meaning, example, note, importance, first_session_id
      ) values (
        p_user_id, v_item->>'type', v_item->>'text', v_item->>'meaning',
        v_item->>'example', v_item->>'note', v_item->>'importance', v_session_id
      ) returning id into v_item_id;
      v_new_items := v_new_items + 1;
    else
      update public.learning_items set
        times_seen = times_seen + 1,
        meaning = v_item->>'meaning', example = v_item->>'example',
        note = v_item->>'note', importance = v_item->>'importance', updated_at = now()
      where id = v_item_id;
      v_seen_items := v_seen_items + 1;
    end if;

    insert into public.session_learning_items (session_id, learning_item_id, user_id, example_in_session)
    values (v_session_id, v_item_id, p_user_id, v_item->>'example')
    on conflict do nothing;
  end loop;

  for v_correction in select value from jsonb_array_elements(p_payload->'corrections') loop
    insert into public.mistake_events (user_id, session_id, category, original, corrected, explanation)
    values (p_user_id, v_session_id, v_correction->>'category', v_correction->>'original', v_correction->>'corrected', v_correction->>'explanation');
    v_corrections := v_corrections + 1;
  end loop;

  for v_recurring in select value from jsonb_array_elements(p_payload->'recurring_mistakes') loop
    for v_example in select value from jsonb_array_elements(v_recurring->'examples') loop
      insert into public.mistake_events (user_id, session_id, category, original, explanation, is_recurring)
      values (p_user_id, v_session_id, v_recurring->>'category', v_example #>> '{}', v_recurring->>'description', true);
      v_recurring_events := v_recurring_events + 1;
    end loop;
  end loop;

  return jsonb_build_object(
    'duplicate', false, 'session_id', v_session_id,
    'session_date', p_payload->>'session_date',
    'duration_minutes', p_payload->'duration_minutes',
    'new_items', v_new_items, 'seen_items', v_seen_items,
    'corrections', v_corrections,
    'recurring_events', v_recurring_events,
    'due_tomorrow', (select count(*) from public.learning_items where user_id = p_user_id and status = 'active' and next_review_at <= current_date + 1)
  );
end;
$$;

revoke all on function public.ingest_english_session(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_english_session(uuid, jsonb) to service_role;
