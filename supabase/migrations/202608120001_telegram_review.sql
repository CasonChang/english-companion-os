-- Atomic service-role review persistence and safe immediate rating override.
alter table public.review_events add column if not exists previous_srs_state jsonb;

create or replace function public.save_telegram_review_result(
  p_user_id uuid, p_learning_item_id uuid, p_mistake_category text,
  p_question_type text, p_question text, p_user_answer text,
  p_evaluation text, p_rating text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event_id uuid; v_item public.learning_items; v_before jsonb; v_intervals integer[]; v_level integer; v_good integer; v_days integer; v_status text;
begin
  if p_rating not in ('again','hard','good','easy') then raise exception 'invalid rating'; end if;
  if (p_learning_item_id is null) = (p_mistake_category is null) then raise exception 'exactly one target is required'; end if;
  if p_learning_item_id is not null then
    select * into v_item from public.learning_items where id=p_learning_item_id and user_id=p_user_id for update;
    if not found then raise exception 'learning item not found'; end if;
    v_before := jsonb_build_object('review_level',v_item.review_level,'next_review_at',v_item.next_review_at,'last_reviewed_at',v_item.last_reviewed_at,'consecutive_good',v_item.consecutive_good,'status',v_item.status);
    select coalesce(srs_intervals,array[1,3,7,14,30]) into v_intervals from public.user_settings where user_id=p_user_id;
    v_intervals := coalesce(v_intervals,array[1,3,7,14,30]);
    case p_rating
      when 'again' then v_level:=0; v_good:=0; v_days:=1; v_status:='active';
      when 'hard' then v_level:=v_item.review_level; v_good:=0; v_days:=case when v_level=0 then 1 else greatest(1,ceil(v_intervals[v_level]/2.0)::integer) end; v_status:='active';
      when 'good' then v_level:=least(5,v_item.review_level+1); v_good:=v_item.consecutive_good+1; v_days:=v_intervals[v_level]; v_status:=case when v_level=5 and v_good>=2 then 'mastered' else 'active' end;
      when 'easy' then v_level:=least(5,v_item.review_level+2); v_good:=v_item.consecutive_good+1; v_days:=v_intervals[v_level]; v_status:=case when v_level=5 and v_good>=2 then 'mastered' else 'active' end;
    end case;
    update public.learning_items set review_level=v_level,next_review_at=current_date+v_days,last_reviewed_at=now(),consecutive_good=v_good,status=v_status,updated_at=now() where id=p_learning_item_id;
  end if;
  insert into public.review_events(user_id,learning_item_id,mistake_category,channel,question_type,question,user_answer,evaluation,rating,previous_srs_state)
  values(p_user_id,p_learning_item_id,p_mistake_category,'telegram',p_question_type,p_question,p_user_answer,p_evaluation,p_rating,v_before) returning id into v_event_id;
  return jsonb_build_object('event_id',v_event_id,'rating',p_rating,'learning_item_id',p_learning_item_id,'srs_updated',p_learning_item_id is not null);
end $$;

create or replace function public.override_telegram_review_rating(p_user_id uuid,p_event_id uuid,p_rating text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event public.review_events; v_state jsonb;
begin
  if p_rating not in ('again','hard','good','easy') then raise exception 'invalid rating'; end if;
  select * into v_event from public.review_events where id=p_event_id and user_id=p_user_id and channel='telegram' for update;
  if not found then raise exception 'review event not found'; end if;
  if v_event.created_at < now()-interval '15 minutes' then raise exception 'override window expired'; end if;
  if v_event.learning_item_id is null then update public.review_events set rating=p_rating where id=p_event_id; return jsonb_build_object('event_id',p_event_id,'rating',p_rating,'srs_updated',false); end if;
  v_state:=v_event.previous_srs_state;
  update public.learning_items set review_level=(v_state->>'review_level')::integer,next_review_at=(v_state->>'next_review_at')::date,last_reviewed_at=(v_state->>'last_reviewed_at')::timestamptz,consecutive_good=(v_state->>'consecutive_good')::integer,status=v_state->>'status' where id=v_event.learning_item_id and user_id=p_user_id;
  delete from public.review_events where id=p_event_id;
  return public.save_telegram_review_result(p_user_id,v_event.learning_item_id,null,v_event.question_type,v_event.question,v_event.user_answer,v_event.evaluation,p_rating);
end $$;

revoke all on function public.save_telegram_review_result(uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.override_telegram_review_rating(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.save_telegram_review_result(uuid,uuid,text,text,text,text,text,text) to service_role;
grant execute on function public.override_telegram_review_rating(uuid,uuid,text) to service_role;
