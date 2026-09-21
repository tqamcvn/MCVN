begin;
alter table public.feedback drop constraint feedback_status_check;
alter table public.feedback add constraint feedback_status_check check(status in ('Đang xem xét','Đã nhận','Đã lên kế hoạch','Đang thực hiện','Hoàn thành','Chưa thực hiện'));
create or replace function public.feedback_is_manager() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.app_users a join auth.users u on lower(a.email)=lower(u.email) where u.id=auth.uid() and a.active=true and lower(trim(a.role)) in ('senior tqa','tl tqa','sup tqa','acting tl tqa'));
$$;
revoke all on function public.feedback_is_manager() from public;
grant execute on function public.feedback_is_manager() to authenticated;
create table public.feedback_replies (
 id uuid primary key default gen_random_uuid(), feedback_id uuid not null references public.feedback(id) on delete cascade,
 author_id uuid not null default auth.uid() references auth.users(id), body text not null check(char_length(trim(body)) between 1 and 10000), created_at timestamptz not null default now()
);
alter table public.feedback_replies enable row level security;
grant select,insert on public.feedback_replies to authenticated;
create policy replies_read on public.feedback_replies for select to authenticated using(true);
create policy replies_manager_insert on public.feedback_replies for insert to authenticated with check(author_id=auth.uid() and public.feedback_is_manager());
create index feedback_replies_parent on public.feedback_replies(feedback_id,created_at);
create or replace function public.feedback_set_status(target_id uuid, new_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.feedback_is_manager() then raise exception 'Manager permission required' using errcode='42501'; end if;
 if new_status not in ('Đã nhận','Hoàn thành') or new_status is null then raise exception 'Invalid status'; end if;
 update public.feedback set status=new_status where id=target_id;
 if not found then raise exception 'Feedback not found'; end if;
end; $$;
revoke all on function public.feedback_set_status(uuid,text) from public;
grant execute on function public.feedback_set_status(uuid,text) to authenticated;
create or replace function public.feedback_people() returns table(id uuid,display_name text,avatar_url text) language sql stable security definer set search_path='' as $$
 select u.id,coalesce(nullif(a.full_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'Thành viên'),
 coalesce(u.raw_user_meta_data->>'avatar',u.raw_user_meta_data->>'avatar_url',u.raw_user_meta_data->>'picture','')
 from auth.users u left join public.app_users a on lower(a.email)=lower(u.email)
 where auth.uid() is not null and (exists(select 1 from public.feedback f where f.author_id=u.id) or exists(select 1 from public.feedback_replies r where r.author_id=u.id));
$$;
revoke all on function public.feedback_people() from public;
grant execute on function public.feedback_people() to authenticated;
commit;
