-- Unit-style checks for the shared SRS ladder. Run after all migrations.
-- The transaction is rolled back, so this file leaves no application data.

begin;

insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

insert into public.user_settings (user_id, srs_intervals)
values ('00000000-0000-0000-0000-000000000001', array[1, 3, 7, 14, 30])
on conflict (user_id) do update set srs_intervals = excluded.srs_intervals;

insert into public.learning_items (
  id,
  user_id,
  type,
  text,
  meaning,
  example,
  next_review_at
)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'phrase',
  'test phrase',
  'used only by migration tests',
  'This is a test phrase.',
  current_date
)
on conflict (id) do nothing;

-- Again resets to level 0, clears the streak, reactivates, and is due tomorrow.
update public.learning_items
set review_level = 3, consecutive_good = 2, status = 'mastered'
where id = '10000000-0000-0000-0000-000000000001';

select public.apply_review_rating(
  '10000000-0000-0000-0000-000000000001',
  'again'
);

do $$
declare item public.learning_items;
begin
  select * into item from public.learning_items
  where id = '10000000-0000-0000-0000-000000000001';
  assert item.review_level = 0, 'Again must reset the level';
  assert item.consecutive_good = 0, 'Again must reset consecutive Good';
  assert item.status = 'active', 'Again must reactivate the item';
  assert item.next_review_at = current_date + 1, 'Again must be due tomorrow';
end;
$$;

-- Hard stays at level 3, resets the streak, and uses half of 7 days (rounded up).
update public.learning_items
set review_level = 3, consecutive_good = 2, status = 'active'
where id = '10000000-0000-0000-0000-000000000001';

select public.apply_review_rating(
  '10000000-0000-0000-0000-000000000001',
  'hard'
);

do $$
declare item public.learning_items;
begin
  select * into item from public.learning_items
  where id = '10000000-0000-0000-0000-000000000001';
  assert item.review_level = 3, 'Hard must keep the level';
  assert item.consecutive_good = 0, 'Hard must reset consecutive Good';
  assert item.next_review_at = current_date + 4, 'Hard must use half interval';
end;
$$;

-- Good advances one level and uses the new level's interval.
update public.learning_items
set review_level = 2, consecutive_good = 0, status = 'active'
where id = '10000000-0000-0000-0000-000000000001';

select public.apply_review_rating(
  '10000000-0000-0000-0000-000000000001',
  'good'
);

do $$
declare item public.learning_items;
begin
  select * into item from public.learning_items
  where id = '10000000-0000-0000-0000-000000000001';
  assert item.review_level = 3, 'Good must advance one level';
  assert item.consecutive_good = 1, 'Good must increment consecutive Good';
  assert item.next_review_at = current_date + 7, 'Good must use the new interval';
end;
$$;

-- Easy advances two levels and uses the new level's interval.
update public.learning_items
set review_level = 1, consecutive_good = 0, status = 'active'
where id = '10000000-0000-0000-0000-000000000001';

select public.apply_review_rating(
  '10000000-0000-0000-0000-000000000001',
  'easy'
);

do $$
declare item public.learning_items;
begin
  select * into item from public.learning_items
  where id = '10000000-0000-0000-0000-000000000001';
  assert item.review_level = 3, 'Easy must advance two levels';
  assert item.consecutive_good = 1, 'Easy must increment consecutive Good';
  assert item.next_review_at = current_date + 7, 'Easy must use the new interval';
end;
$$;

-- Level 5 is mastered only after the second consecutive Good/Easy result.
update public.learning_items
set review_level = 4, consecutive_good = 0, status = 'active'
where id = '10000000-0000-0000-0000-000000000001';

select public.apply_review_rating(
  '10000000-0000-0000-0000-000000000001',
  'good'
);

do $$
declare item public.learning_items;
begin
  select * into item from public.learning_items
  where id = '10000000-0000-0000-0000-000000000001';
  assert item.review_level = 5, 'Good must reach level 5';
  assert item.consecutive_good = 1, 'First Good must set streak to one';
  assert item.status = 'active', 'First level-5 Good must remain active';
end;
$$;

select public.apply_review_rating(
  '10000000-0000-0000-0000-000000000001',
  'good'
);

do $$
declare item public.learning_items;
begin
  select * into item from public.learning_items
  where id = '10000000-0000-0000-0000-000000000001';
  assert item.review_level = 5, 'Mastered item must remain at level 5';
  assert item.consecutive_good = 2, 'Second Good must set streak to two';
  assert item.status = 'mastered', 'Second level-5 Good must master the item';
  assert item.next_review_at = current_date + 30, 'Level 5 must use 30 days';
end;
$$;

rollback;
