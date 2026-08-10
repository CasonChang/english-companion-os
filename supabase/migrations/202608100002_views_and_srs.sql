-- English Companion OS: aggregate views and the authenticated SRS transition.

create or replace view public.v_weekly_activity
with (security_invoker = true)
as
with activity_weeks as (
  select user_id, date_trunc('week', session_date)::date as week_start
  from public.sessions
  union
  select user_id, date_trunc('week', created_at)::date as week_start
  from public.learning_items
  union
  select user_id, date_trunc('week', created_at)::date as week_start
  from public.review_events
)
select
  activity_weeks.user_id,
  activity_weeks.week_start,
  coalesce((
    select sum(coalesce(s.duration_minutes, 0))::integer
    from public.sessions as s
    where s.user_id = activity_weeks.user_id
      and s.session_date >= activity_weeks.week_start
      and s.session_date < activity_weeks.week_start + 7
  ), 0) as total_minutes,
  (
    select count(*)::integer
    from public.sessions as s
    where s.user_id = activity_weeks.user_id
      and s.session_date >= activity_weeks.week_start
      and s.session_date < activity_weeks.week_start + 7
  ) as session_count,
  (
    select count(*)::integer
    from public.learning_items as li
    where li.user_id = activity_weeks.user_id
      and li.created_at >= activity_weeks.week_start
      and li.created_at < activity_weeks.week_start + 7
  ) as new_items,
  (
    select count(*)::integer
    from public.review_events as re
    where re.user_id = activity_weeks.user_id
      and re.created_at >= activity_weeks.week_start
      and re.created_at < activity_weeks.week_start + 7
  ) as reviews_done
from activity_weeks;

create or replace view public.v_mistake_category_stats
with (security_invoker = true)
as
select
  user_id,
  category,
  count(*)::integer as total_count,
  count(*) filter (
    where created_at >= current_date - interval '29 days'
  )::integer as last_30_days_count,
  count(*) filter (
    where created_at >= current_date - interval '59 days'
      and created_at < current_date - interval '29 days'
  )::integer as previous_30_days_count,
  case
    when count(*) filter (
      where created_at >= current_date - interval '29 days'
    ) < count(*) filter (
      where created_at >= current_date - interval '59 days'
        and created_at < current_date - interval '29 days'
    ) then 'improving'
    when count(*) filter (
      where created_at >= current_date - interval '29 days'
    ) > count(*) filter (
      where created_at >= current_date - interval '59 days'
        and created_at < current_date - interval '29 days'
    ) then 'growing'
    else 'flat'
  end as trend
from public.mistake_events
group by user_id, category;

create or replace view public.v_due_reviews
with (security_invoker = true)
as
select
  li.id,
  li.user_id,
  li.type,
  li.text,
  li.normalized_text,
  li.meaning,
  li.example,
  li.note,
  li.importance,
  li.first_session_id,
  li.times_seen,
  li.review_level,
  li.next_review_at,
  li.last_reviewed_at,
  li.consecutive_good,
  li.status,
  li.created_at,
  li.updated_at,
  current_date - li.next_review_at as days_overdue
from public.learning_items as li
where li.status = 'active'
  and li.next_review_at <= current_date
order by li.next_review_at, li.importance = 'high' desc, li.created_at;

create or replace function public.apply_review_rating(item_id uuid, rating text)
returns public.learning_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_item public.learning_items;
  intervals integer[];
  new_level integer;
  new_consecutive_good integer;
  interval_days integer;
  new_status text;
begin
  if rating not in ('again', 'hard', 'good', 'easy') then
    raise exception 'Invalid review rating'
      using errcode = '22023';
  end if;

  select *
  into current_item
  from public.learning_items
  where id = item_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Learning item not found'
      using errcode = 'P0002';
  end if;

  select coalesce(us.srs_intervals, array[1, 3, 7, 14, 30])
  into intervals
  from public.user_settings as us
  where us.user_id = current_item.user_id;

  intervals := coalesce(intervals, array[1, 3, 7, 14, 30]);

  case rating
    when 'again' then
      new_level := 0;
      new_consecutive_good := 0;
      interval_days := 1;
      new_status := 'active';
    when 'hard' then
      new_level := current_item.review_level;
      new_consecutive_good := 0;
      interval_days := case
        when new_level = 0 then 1
        else greatest(1, ceil(intervals[new_level] / 2.0)::integer)
      end;
      new_status := 'active';
    when 'good' then
      new_level := least(5, current_item.review_level + 1);
      new_consecutive_good := current_item.consecutive_good + 1;
      interval_days := intervals[new_level];
      new_status := case
        when new_level = 5 and new_consecutive_good >= 2 then 'mastered'
        else 'active'
      end;
    when 'easy' then
      new_level := least(5, current_item.review_level + 2);
      new_consecutive_good := current_item.consecutive_good + 1;
      interval_days := intervals[new_level];
      new_status := case
        when new_level = 5 and new_consecutive_good >= 2 then 'mastered'
        else 'active'
      end;
  end case;

  update public.learning_items
  set review_level = new_level,
      next_review_at = current_date + interval_days,
      last_reviewed_at = now(),
      consecutive_good = new_consecutive_good,
      status = new_status,
      updated_at = now()
  where id = current_item.id
  returning * into current_item;

  return current_item;
end;
$$;

revoke all on function public.apply_review_rating(uuid, text) from public;
grant execute on function public.apply_review_rating(uuid, text) to authenticated;
