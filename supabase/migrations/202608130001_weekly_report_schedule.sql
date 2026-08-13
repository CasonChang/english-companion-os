-- Atomically decide whether the configured weekly report is due.
alter table public.user_settings add column if not exists last_weekly_report_claim_at timestamptz;

create or replace function public.claim_weekly_report_schedule(p_user_id uuid, p_now timestamptz default now())
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.user_settings; v_local timestamp; v_minutes integer; v_target integer; v_week_start date; v_week_end date;
begin
  select * into v from public.user_settings where user_id=p_user_id for update;
  if not found or not v.weekly_report_enabled then return jsonb_build_object('action','silent','reason','disabled'); end if;
  begin v_local:=p_now at time zone v.timezone; exception when invalid_parameter_value then return jsonb_build_object('action','silent','reason','invalid_timezone'); end;
  v_minutes:=extract(hour from v_local)::integer*60+extract(minute from v_local)::integer;
  v_target:=extract(hour from v.weekly_report_time)::integer*60+extract(minute from v.weekly_report_time)::integer;
  if extract(dow from v_local)::integer<>v.weekly_report_day or v_minutes<v_target or v_minutes>=v_target+15 then
    return jsonb_build_object('action','silent','reason','outside_window');
  end if;
  v_week_end:=v_local::date-extract(dow from v_local)::integer;
  v_week_start:=v_week_end-6;
  if exists(select 1 from public.weekly_reports where user_id=p_user_id and week_start=v_week_start) then
    return jsonb_build_object('action','silent','reason','already_generated');
  end if;
  if v.last_weekly_report_claim_at is not null and (v.last_weekly_report_claim_at at time zone v.timezone)::date=v_local::date then
    return jsonb_build_object('action','silent','reason','already_claimed');
  end if;
  update public.user_settings set last_weekly_report_claim_at=p_now where user_id=p_user_id;
  return jsonb_build_object('action','report','week_start',v_week_start,'week_end',v_week_end,'timezone',v.timezone);
end $$;

revoke all on function public.claim_weekly_report_schedule(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.claim_weekly_report_schedule(uuid,timestamptz) to service_role;
