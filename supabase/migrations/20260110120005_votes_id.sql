alter table public.votes
  add column if not exists id uuid default gen_random_uuid();

update public.votes
set id = gen_random_uuid()
where id is null;

create unique index if not exists votes_id_key on public.votes(id);
