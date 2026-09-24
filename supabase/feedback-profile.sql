begin;
create or replace function public.feedback_user_profile(target_id uuid) returns table(display_name text,nickname text,avatar_url text,role text,team text) language sql stable security definer set search_path='' as $$
 select coalesce(nullif(a.full_name,''),nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),'Thành viên'),
 coalesce(u.raw_user_meta_data->>'display_name',''),
 coalesce(u.raw_user_meta_data->>'avatar',u.raw_user_meta_data->>'avatar_url',u.raw_user_meta_data->>'picture',''),
 coalesce(nullif(a.role,''),case when lower(split_part(u.email,'@',2))='shopee.com' then 'IH' else 'Member' end),coalesce(a.team,'')
 from auth.users u left join public.app_users a on lower(a.email)=lower(u.email)
 where auth.uid() is not null and u.id=target_id and (a.active=true or (a.id is null and lower(split_part(u.email,'@',2))='shopee.com'));
$$;
revoke all on function public.feedback_user_profile(uuid) from public;
grant execute on function public.feedback_user_profile(uuid) to authenticated;
commit;
