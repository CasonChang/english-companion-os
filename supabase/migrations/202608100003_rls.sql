-- English Companion OS: browser authorization boundary.
-- Hermes uses Supabase's service_role and bypasses these policies server-side.

alter table public.sessions enable row level security;
alter table public.learning_items enable row level security;
alter table public.session_learning_items enable row level security;
alter table public.mistake_events enable row level security;
alter table public.review_events enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
  on public.sessions for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "learning_items_select_own" on public.learning_items;
create policy "learning_items_select_own"
  on public.learning_items for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "session_learning_items_select_own" on public.session_learning_items;
create policy "session_learning_items_select_own"
  on public.session_learning_items for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "mistake_events_select_own" on public.mistake_events;
create policy "mistake_events_select_own"
  on public.mistake_events for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "review_events_select_own" on public.review_events;
create policy "review_events_select_own"
  on public.review_events for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "weekly_reports_select_own" on public.weekly_reports;
create policy "weekly_reports_select_own"
  on public.weekly_reports for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "review_events_insert_own_web" on public.review_events;
create policy "review_events_insert_own_web"
  on public.review_events for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and channel = 'web'
    and (
      learning_item_id is null
      or exists (
        select 1
        from public.learning_items as owned_item
        where owned_item.id = learning_item_id
          and owned_item.user_id = auth.uid()
      )
    )
  );

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Anonymous API calls may issue reads, but with no anon RLS policies they see
-- empty result sets. Authenticated browser writes are deliberately narrow.
revoke all on table
  public.sessions,
  public.learning_items,
  public.session_learning_items,
  public.mistake_events,
  public.review_events,
  public.weekly_reports,
  public.user_settings
from anon, authenticated;

grant select on table
  public.sessions,
  public.learning_items,
  public.session_learning_items,
  public.mistake_events,
  public.review_events,
  public.weekly_reports,
  public.user_settings
to anon, authenticated;

grant insert on table public.review_events to authenticated;
grant update on table public.user_settings to authenticated;

revoke all on table
  public.v_weekly_activity,
  public.v_mistake_category_stats,
  public.v_due_reviews
from anon, authenticated;

grant select on table
  public.v_weekly_activity,
  public.v_mistake_category_stats,
  public.v_due_reviews
to anon, authenticated;

revoke execute on function public.apply_review_rating(uuid, text) from anon;
grant execute on function public.apply_review_rating(uuid, text) to authenticated;
