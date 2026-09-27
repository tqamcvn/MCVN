-- Private, account-owned AI mascots. Run before deploying mascot-create.
create table public.mascot_creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  status text not null default 'generating' check (status in ('generating','ready','failed')),
  sheet_path text,
  created_at timestamptz not null default now()
);
create index mascot_creations_owner_time on public.mascot_creations(user_id, created_at desc);
alter table public.mascot_creations enable row level security;
create policy "Read own mascots" on public.mascot_creations for select to authenticated using (user_id = auth.uid());
revoke all on public.mascot_creations from anon, authenticated;
grant select on public.mascot_creations to authenticated;
grant all on public.mascot_creations to service_role;

create table public.mascot_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  choice text not null default 'lantern'
);
alter table public.mascot_preferences enable row level security;
create policy "Read own mascot preference" on public.mascot_preferences for select to authenticated using (user_id = auth.uid());
create policy "Insert own mascot preference" on public.mascot_preferences for insert to authenticated with check (
  user_id = auth.uid() and (choice in ('lantern','raccoon','fox','sloth','bunny','sheep','wizard','cube','pug') or exists (
    select 1 from public.mascot_creations m where m.id::text = choice and m.user_id = auth.uid() and m.status = 'ready'
  ))
);
create policy "Update own mascot preference" on public.mascot_preferences for update to authenticated using (user_id = auth.uid()) with check (
  user_id = auth.uid() and (choice in ('lantern','raccoon','fox','sloth','bunny','sheep','wizard','cube','pug') or exists (
    select 1 from public.mascot_creations m where m.id::text = choice and m.user_id = auth.uid() and m.status = 'ready'
  ))
);
revoke all on public.mascot_preferences from anon, authenticated;
grant select, insert, update on public.mascot_preferences to authenticated;
grant all on public.mascot_preferences to service_role;

-- Reserve a paid attempt atomically. Failed attempts count too, preventing abuse.
create function public.reserve_mascot(p_user uuid, p_name text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  if exists (select 1 from public.mascot_creations where user_id=p_user and status='generating' and created_at>now()-interval '3 minutes') then
    raise exception 'MASCOT_BUSY';
  end if;
  if (select count(*) from public.mascot_creations where user_id=p_user and created_at>now()-interval '24 hours') >= 3 then
    raise exception 'MASCOT_LIMIT';
  end if;
  update public.mascot_creations set status='failed' where user_id=p_user and status='generating';
  insert into public.mascot_creations(user_id,name) values(p_user,p_name) returning id into new_id;
  return new_id;
end $$;
revoke all on function public.reserve_mascot(uuid,text) from public, anon, authenticated;
grant execute on function public.reserve_mascot(uuid,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('user-mascots','user-mascots',false,12582912,array['image/png'])
on conflict(id) do nothing;
create policy "Read own mascot images" on storage.objects for select to authenticated
using (bucket_id='user-mascots' and (storage.foldername(name))[1]=auth.uid()::text);
