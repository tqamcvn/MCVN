-- Apply after feedback-management.sql and before publishing the updated frontend.
begin;
alter table public.feedback_replies add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.feedback_replies drop constraint if exists feedback_reply_attachment_limit;
alter table public.feedback_replies add constraint feedback_reply_attachment_limit
 check (jsonb_typeof(attachments)='array' and jsonb_array_length(attachments)<=3);
drop policy if exists replies_manager_insert on public.feedback_replies;
drop policy if exists replies_user_insert on public.feedback_replies;
create policy replies_user_insert on public.feedback_replies for insert to authenticated
 with check(author_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('feedback-reply-attachments','feedback-reply-attachments',false,5242880,
 array['image/png','image/jpeg','image/webp','application/pdf','text/plain','text/csv','application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
 on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists feedback_reply_file_upload on storage.objects;
create policy feedback_reply_file_upload on storage.objects for insert to authenticated
 with check(bucket_id='feedback-reply-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists feedback_reply_file_read on storage.objects;
create policy feedback_reply_file_read on storage.objects for select to authenticated
 using(bucket_id='feedback-reply-attachments');
commit;
