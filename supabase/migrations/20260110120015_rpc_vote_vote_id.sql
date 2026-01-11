create or replace function public.rpc_vote(p_artifact_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_votes_count int;
  v_vote_id uuid;
begin
  if v_user_id is null then
    return json_build_object('success', false, 'votes_count', 0, 'error', 'Not authenticated');
  end if;

  if not exists (select 1 from public.artifacts a where a.id = p_artifact_id) then
    return json_build_object('success', false, 'votes_count', 0, 'error', 'Artifact not found');
  end if;

  insert into public.votes (artifact_id, user_id)
  values (p_artifact_id, v_user_id)
  on conflict do nothing;

  select a.votes_count into v_votes_count
  from public.artifacts a
  where a.id = p_artifact_id;

  select v.id into v_vote_id
  from public.votes v
  where v.artifact_id = p_artifact_id and v.user_id = v_user_id;

  return json_build_object(
    'success', true,
    'votes_count', coalesce(v_votes_count, 0),
    'vote_id', v_vote_id,
    'error', null
  );
exception
  when others then
    select a.votes_count into v_votes_count
    from public.artifacts a
    where a.id = p_artifact_id;
    return json_build_object('success', false, 'votes_count', coalesce(v_votes_count, 0), 'error', sqlerrm);
end;
$$;
