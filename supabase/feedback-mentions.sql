begin;
create function public.feedback_mention_users() returns table(id uuid,display_name text,email text) language sql stable security definer set search_path='' as $$
 select u.id,coalesce(nullif(a.full_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),split_part(u.email,'@',1)),u.email::text
 from auth.users u left join public.app_users a on lower(a.email)=lower(u.email)
 where auth.uid() is not null and (a.active=true or (a.id is null and lower(split_part(u.email,'@',2))='shopee.com'));
$$;
revoke all on function public.feedback_mention_users() from public;
grant execute on function public.feedback_mention_users() to authenticated;
alter table public.feedback_notifications drop constraint feedback_notifications_kind_check;
alter table public.feedback_notifications add constraint feedback_notifications_kind_check check(kind in ('reply','status','mention'));
create function public.feedback_notify_mentions() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; owner_id uuid; actor_label text;
begin
 if tg_table_name='feedback' then target:=new.id; owner_id:=null;
 else target:=new.feedback_id;select author_id into owner_id from public.feedback where id=target;end if;
 select coalesce(nullif(a.full_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'Thành viên') into actor_label from auth.users u left join public.app_users a on lower(a.email)=lower(u.email) where u.id=new.author_id;
 insert into public.feedback_notifications(recipient_id,feedback_id,actor_id,actor_name,kind)
 select distinct d.id,target,new.author_id,coalesce(actor_label,'Thành viên'),'mention'
 from public.feedback_mention_users() d
 join regexp_matches(new.body,'@([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})','g') m on lower(d.email)=lower(m[1])
 where d.id<>new.author_id and (owner_id is null or d.id<>owner_id);
 return new;
end; $$;
create trigger feedback_mentions after insert on public.feedback for each row execute function public.feedback_notify_mentions();
create trigger feedback_reply_mentions after insert on public.feedback_replies for each row execute function public.feedback_notify_mentions();
commit;
