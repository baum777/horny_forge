create or replace function public.award_event(
  p_event_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_subject_id text,
  p_source text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today text := to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD');
  v_yesterday text := to_char(((now() at time zone 'utc')::date - 1), 'YYYY-MM-DD');
  v_stats record;
  v_limits record;
  v_counters jsonb;
  v_event_count int := 0;
  v_event_xp int := 0;
  v_event_cap int;
  v_xp_added int := 0;
  v_bonus_added int := 0;
  v_total_added int := 0;
  v_available int := 0;
  v_xp_today int := 0;
  v_new_xp bigint := 0;
  v_new_level int := 1;
  v_streak_days int := 0;
  v_new_badges text[] := '{}';
  v_existing_badges text[] := '{}';
  v_votes_count int := 0;
  v_tag_count int := 0;
begin
  -- Idempotency gate
  begin
    insert into public.processed_events(event_id, actor_user_id, event_type, subject_id, source)
    values (p_event_id, p_actor_user_id, p_event_type, p_subject_id, p_source);
  exception when unique_violation then
    return jsonb_build_object('ok', true, 'noop', true);
  end;

  -- Ensure user_stats row
  insert into public.user_stats(user_id, xp_total, level, streak_days, last_active_at, updated_at)
  values (p_actor_user_id, 0, 1, 0, null, now())
  on conflict (user_id) do nothing;

  select user_id, xp_total, level, streak_days, last_active_at
    into v_stats
  from public.user_stats
  where user_id = p_actor_user_id;

  if v_stats.xp_total is null then
    v_stats.xp_total := 0;
  end if;
  if v_stats.level is null then
    v_stats.level := 1;
  end if;
  if v_stats.streak_days is null then
    v_stats.streak_days := 0;
  end if;

  -- Ensure daily limits row
  insert into public.user_daily_limits(user_id, day, xp_today, counters, updated_at)
  values (p_actor_user_id, v_today, 0, '{}'::jsonb, now())
  on conflict (user_id, day) do nothing;

  select user_id, day, xp_today, counters
    into v_limits
  from public.user_daily_limits
  where user_id = p_actor_user_id and day = v_today;

  v_counters := coalesce(v_limits.counters::jsonb, '{}'::jsonb);
  v_event_count := coalesce((v_counters->>p_event_type)::int, 0);

  -- Event config
  case p_event_type
    when 'forge_generate' then v_event_xp := 1; v_event_cap := 10;
    when 'artifact_release' then v_event_xp := 3; v_event_cap := 5;
    when 'vote_cast' then v_event_xp := 1; v_event_cap := 20;
    when 'vote_received' then v_event_xp := 2; v_event_cap := null;
    when 'share_click' then v_event_xp := 2; v_event_cap := 10;
    when 'daily_return' then v_event_xp := 2; v_event_cap := 1;
    else v_event_xp := 0; v_event_cap := null;
  end case;

  if v_event_cap is null or v_event_count < v_event_cap then
    v_xp_added := v_event_xp;
  else
    v_xp_added := 0;
  end if;

  if p_event_type = 'share_click' and p_subject_id is not null then
    select count(*) into v_tag_count
      from public.processed_events
      where actor_user_id = p_actor_user_id
        and event_type = 'share_click'
        and subject_id = p_subject_id
        and created_at >= (now() - interval '1 day');
    if v_tag_count >= 5 then
      v_xp_added := 0;
    end if;
  end if;

  -- Streak handling for daily return
  v_streak_days := v_stats.streak_days;
  if p_event_type = 'daily_return' then
    if v_stats.last_active_at is not null and to_char(v_stats.last_active_at::date, 'YYYY-MM-DD') = v_today then
      v_streak_days := v_stats.streak_days;
    elsif v_stats.last_active_at is not null and to_char(v_stats.last_active_at::date, 'YYYY-MM-DD') = v_yesterday then
      v_streak_days := v_stats.streak_days + 1;
    else
      v_streak_days := 1;
    end if;
  end if;

  v_xp_today := coalesce(v_limits.xp_today, 0);
  v_available := greatest(0, 100 - v_xp_today);
  v_xp_added := least(v_xp_added, v_available);

  if p_event_type = 'daily_return' and v_streak_days > 0 and (v_streak_days % 7 = 0) then
    v_bonus_added := least(5, greatest(0, v_available - v_xp_added));
  end if;

  v_total_added := v_xp_added + v_bonus_added;
  v_new_xp := v_stats.xp_total + v_total_added;

  v_new_level := case
    when v_new_xp >= 1050 then 10
    when v_new_xp >= 750 then 9
    when v_new_xp >= 520 then 8
    when v_new_xp >= 350 then 7
    when v_new_xp >= 220 then 6
    when v_new_xp >= 130 then 5
    when v_new_xp >= 70 then 4
    when v_new_xp >= 30 then 3
    when v_new_xp >= 10 then 2
    else 1
  end;

  v_counters := jsonb_set(v_counters, ARRAY[p_event_type], to_jsonb(v_event_count + 1), true);
  if v_bonus_added > 0 then
    v_counters := jsonb_set(
      v_counters,
      ARRAY['streak_bonus'],
      to_jsonb(coalesce((v_counters->>'streak_bonus')::int, 0) + 1),
      true
    );
  end if;

  update public.user_stats
    set xp_total = v_new_xp,
        level = v_new_level,
        streak_days = v_streak_days,
        last_active_at = now(),
        updated_at = now()
  where user_id = p_actor_user_id;

  update public.user_daily_limits
    set xp_today = least(100, v_xp_today + v_total_added),
        counters = v_counters,
        updated_at = now()
  where user_id = p_actor_user_id and day = v_today;

  v_existing_badges := array(
    select badge_id from public.user_badges where user_id = p_actor_user_id
  );

  -- Badge helpers
  if p_event_type = 'forge_generate' and not ('SIGIL_FIRST_INFUSION' = any(v_existing_badges)) then
    insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'SIGIL_FIRST_INFUSION') on conflict do nothing;
    v_new_badges := array_append(v_new_badges, 'SIGIL_FIRST_INFUSION');
  end if;

  if p_event_type = 'artifact_release' and not ('SIGIL_FIRST_RELEASE' = any(v_existing_badges)) then
    insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'SIGIL_FIRST_RELEASE') on conflict do nothing;
    v_new_badges := array_append(v_new_badges, 'SIGIL_FIRST_RELEASE');
  end if;

  if p_event_type = 'vote_cast' and not ('SIGIL_FIRST_VOTE' = any(v_existing_badges)) then
    insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'SIGIL_FIRST_VOTE') on conflict do nothing;
    v_new_badges := array_append(v_new_badges, 'SIGIL_FIRST_VOTE');
  end if;

  if p_event_type = 'daily_return' then
    if v_streak_days >= 2 and not ('FRAGMENT_RETURN_2D' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'FRAGMENT_RETURN_2D') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'FRAGMENT_RETURN_2D');
    end if;
    if v_streak_days >= 7 and not ('FRAGMENT_RETURN_7D' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'FRAGMENT_RETURN_7D') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'FRAGMENT_RETURN_7D');
    end if;
  end if;

  if p_event_type = 'vote_received' and p_subject_id is not null then
    select votes_count into v_votes_count from public.artifacts where id = p_subject_id::uuid;
    if v_votes_count >= 10 and not ('STAMP_TREND_SPARK' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'STAMP_TREND_SPARK') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'STAMP_TREND_SPARK');
    end if;
    if v_votes_count >= 25 and not ('STAMP_FEED_DOMINATOR' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'STAMP_FEED_DOMINATOR') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'STAMP_FEED_DOMINATOR');
    end if;
  end if;

  if p_event_type = 'artifact_release' then
    select count(*) into v_tag_count
      from public.artifacts
      where author_id = p_actor_user_id and tags @> ARRAY['#CroisHorney'];
    if v_tag_count >= 3 and not ('OBJECT_CROISHORNEY' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'OBJECT_CROISHORNEY') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'OBJECT_CROISHORNEY');
    end if;

    select count(*) into v_tag_count
      from public.artifacts
      where author_id = p_actor_user_id and tags @> ARRAY['#EichHorney'];
    if v_tag_count >= 3 and not ('OBJECT_EICHHORNEY' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'OBJECT_EICHHORNEY') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'OBJECT_EICHHORNEY');
    end if;

    select count(*) into v_tag_count
      from public.artifacts
      where author_id = p_actor_user_id and tags @> ARRAY['#BrainHorney'];
    if v_tag_count >= 3 and not ('OBJECT_BRAINHORNEY' = any(v_existing_badges)) then
      insert into public.user_badges(user_id, badge_id) values (p_actor_user_id, 'OBJECT_BRAINHORNEY') on conflict do nothing;
      v_new_badges := array_append(v_new_badges, 'OBJECT_BRAINHORNEY');
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'noop', false,
    'xp_added', v_total_added,
    'xp_total', v_new_xp,
    'level', v_new_level,
    'streak_days', v_streak_days,
    'new_badges', v_new_badges
  );
end;
$$;

revoke all on function public.award_event(uuid, uuid, text, text, text) from public;
grant execute on function public.award_event(uuid, uuid, text, text, text) to service_role;
