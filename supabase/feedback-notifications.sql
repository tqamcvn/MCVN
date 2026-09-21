begin;
create table public.feedback_notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references auth.users(id), feedback_id uuid not null references public.feedback(id) on delete cascade,
 actor_id uuid not null references auth.users(id), actor_name text not null, kind text not null check(kind in ('reply','status')), status text, created_at timestamptz not null default now(), read_at timestamptz
);
alter table public.feedback_notifications enable row level security;
grant select on public.feedback_notifications to authenticated;
create policy notifications_own on public.feedback_notifications for select to authenticated using(recipient_id=auth.uid());
create index feedback_notifications_recipient on public.feedback_notifications(recipient_id,created_at desc);
create function public.feedback_notify() returns trigger language plpgsql security definer set search_path='' as $$
declare actor_label text;
begin
 if auth.uid() is null or new.author_id=auth.uid() or new.status is not distinct from old.status then return new; end if;
 select coalesce(nullif(a.full_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'MNG') into actor_label from auth.users u left join public.app_users a on lower(a.email)=lower(u.email) where u.id=auth.uid();
 insert into public.feedback_notifications(recipient_id,feedback_id,actor_id,actor_name,kind,status) values(new.author_id,new.id,auth.uid(),coalesce(actor_label,'MNG'),'status',new.status);
 return new;
end; $$;
-- Separate reply trigger avoids accessing status on a reply record.
create function public.feedback_notify_reply() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.feedback_notifications(recipient_id,feedback_id,actor_id,actor_name,kind)
 select f.author_id,f.id,new.author_id,coalesce(nullif(a.full_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'MNG'),'reply'
 from public.feedback f join auth.users u on u.id=new.author_id left join public.app_users a on lower(a.email)=lower(u.email) where f.id=new.feedback_id and f.author_id<>new.author_id;
 return new;
end; $$;
create trigger feedback_status_notification after update of status on public.feedback for each row execute function public.feedback_notify();
create trigger feedback_reply_notification after insert on public.feedback_replies for each row execute function public.feedback_notify_reply();
create function public.feedback_read_notification(notification_id uuid) returns void language sql security definer set search_path='' as $$ update public.feedback_notifications set read_at=coalesce(read_at,now()) where id=notification_id and recipient_id=auth.uid(); $$;
revoke all on function public.feedback_read_notification(uuid) from public;
grant execute on function public.feedback_read_notification(uuid) to authenticated;
create or replace function public.feedback_set_status(target_id uuid,new_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.feedback_is_manager() then raise exception 'Manager permission required' using errcode='42501'; end if;
 if new_status is null or new_status not in ('Đã nhận','Đang thực hiện','Hoàn thành') then raise exception 'Invalid status'; end if;
 update public.feedback set status=new_status where id=target_id;
 if not found then raise exception 'Feedback not found'; end if;
end; $$;
create table public.feedback_experiences (
 feedback_id uuid primary key references public.feedback(id) on delete cascade, author_id uuid not null default auth.uid() references auth.users(id), rating integer not null check(rating between 1 and 5), comment text not null default '' check(char_length(comment)<=2000), created_at timestamptz not null default now()
);
alter table public.feedback_experiences enable row level security;
grant select,insert on public.feedback_experiences to authenticated;
create policy experience_read on public.feedback_experiences for select to authenticated using(author_id=auth.uid() or public.feedback_is_manager());
create policy experience_submit on public.feedback_experiences for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.feedback f where f.id=feedback_id and f.author_id=auth.uid() and f.status='Hoàn thành'));
commit;
