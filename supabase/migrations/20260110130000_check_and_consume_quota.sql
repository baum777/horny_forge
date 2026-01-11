create or replace function public.check_and_consume_quota(
  p_user_id uuid,
  p_key text,
  p_limit int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_current int := 0;
  v_remaining int := 0;
begin
  insert into public.user_daily_counters(user_id, day, key, value, updated_at)
  values (p_user_id, v_today, p_key, 0, now())
  on conflict (user_id, day, key) do nothing;

  select value into v_current
  from public.user_daily_counters
  where user_id = p_user_id and day = v_today and key = p_key
  for update;

  if v_current >= p_limit then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'limit', p_limit
    );
  end if;

  update public.user_daily_counters
    set value = v_current + 1,
        updated_at = now()
  where user_id = p_user_id and day = v_today and key = p_key;

  v_remaining := greatest(p_limit - (v_current + 1), 0);

  return jsonb_build_object(
    'allowed', true,
    'remaining', v_remaining,
    'limit', p_limit
  );
end;
$$;

revoke all on function public.check_and_consume_quota(uuid, text, int) from public;
grant execute on function public.check_and_consume_quota(uuid, text, int) to service_role;
