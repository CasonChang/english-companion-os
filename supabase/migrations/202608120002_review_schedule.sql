-- Database-driven Telegram schedule claiming and settings updates.
alter table public.user_settings add column if not exists last_daily_review_at timestamptz;
alter table public.user_settings add column if not exists last_idle_nudge_at timestamptz;

create or replace function public.claim_telegram_review_schedule(p_user_id uuid, p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_settings public.user_settings; v_local timestamp; v_today date; v_minutes integer; v_target integer; v_last_session date; v_has_candidates boolean;
begin
  select * into v_settings from public.user_settings where user_id=p_user_id for update;
  if not found or not v_settings.daily_review_enabled then return jsonb_build_object('action','silent','reason','disabled'); end if;
  begin v_local := p_now at time zone v_settings.timezone; exception when invalid_parameter_value then return jsonb_build_object('action','silent','reason','invalid_timezone'); end;
  v_today:=v_local::date; v_minutes:=extract(hour from v_local)::integer*60+extract(minute from v_local)::integer; v_target:=extract(hour from v_settings.review_time)::integer*60+extract(minute from v_settings.review_time)::integer;
  if v_minutes < v_target or v_minutes >= v_target+15 then return jsonb_build_object('action','silent','reason','outside_window'); end if;
  if v_settings.last_daily_review_at is not null and (v_settings.last_daily_review_at at time zone v_settings.timezone)::date=v_today then return jsonb_build_object('action','silent','reason','already_claimed'); end if;
  select max(session_date) into v_last_session from public.sessions where user_id=p_user_id;
  if v_last_session is null or v_last_session <= v_today-7 then
    if v_settings.last_idle_nudge_at is null or p_now-v_settings.last_idle_nudge_at>=interval '7 days' then
      update public.user_settings set last_daily_review_at=p_now,last_idle_nudge_at=p_now where user_id=p_user_id;
      return jsonb_build_object('action','nudge','question_count',v_settings.questions_per_review,'timezone',v_settings.timezone);
    end if;
    update public.user_settings set last_daily_review_at=p_now where user_id=p_user_id;
    return jsonb_build_object('action','silent','reason','idle_nudge_throttled');
  end if;
  select exists(select 1 from public.learning_items where user_id=p_user_id and status='active' and next_review_at<=v_today) or exists(select 1 from public.mistake_events where user_id=p_user_id and created_at>=p_now-interval '30 days') into v_has_candidates;
  update public.user_settings set last_daily_review_at=p_now where user_id=p_user_id;
  if not v_has_candidates then return jsonb_build_object('action','silent','reason','no_candidates'); end if;
  return jsonb_build_object('action','review','question_count',v_settings.questions_per_review,'timezone',v_settings.timezone);
end $$;

create or replace function public.update_telegram_review_settings(p_user_id uuid,p_timezone text default null,p_review_time time default null,p_enabled boolean default null,p_question_count integer default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.user_settings;
begin
  if p_question_count is not null and p_question_count not between 3 and 5 then raise exception 'question count must be 3 to 5'; end if;
  if p_timezone is not null then perform now() at time zone p_timezone; end if;
  update public.user_settings set timezone=coalesce(p_timezone,timezone),review_time=coalesce(p_review_time,review_time),daily_review_enabled=coalesce(p_enabled,daily_review_enabled),questions_per_review=coalesce(p_question_count,questions_per_review) where user_id=p_user_id returning * into v;
  if not found then raise exception 'settings not found'; end if;
  return jsonb_build_object('timezone',v.timezone,'review_time',v.review_time,'enabled',v.daily_review_enabled,'question_count',v.questions_per_review);
end $$;
revoke all on function public.claim_telegram_review_schedule(uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.update_telegram_review_settings(uuid,text,time,boolean,integer) from public,anon,authenticated;
grant execute on function public.claim_telegram_review_schedule(uuid,timestamptz) to service_role;
grant execute on function public.update_telegram_review_settings(uuid,text,time,boolean,integer) to service_role;
