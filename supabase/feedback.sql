begin;
-- Apply once in the existing project's Supabase SQL Editor before publishing.
create table if not exists public.feedback (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id),
 title text not null check (char_length(trim(title)) between 1 and 160),
 body text not null check (char_length(trim(body)) between 1 and 10000),
 kind text not null check (kind in ('Lỗi','Đề xuất','Cải tiến','Tính năng')),
 status text not null default 'Đang xem xét' check (status in ('Đang xem xét','Đã lên kế hoạch','Đang thực hiện','Hoàn thành','Chưa thực hiện')),
 attachments jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.feedback_votes (
 feedback_id uuid not null references public.feedback(id) on delete cascade,
 user_id uuid not null references auth.users(id),
 primary key(feedback_id,user_id)
);
alter table public.feedback enable row level security;
alter table public.feedback_votes enable row level security;
grant select,insert on public.feedback to authenticated;
grant select,insert,delete on public.feedback_votes to authenticated;
create policy feedback_read on public.feedback for select to authenticated using (true);
create policy feedback_submit on public.feedback for insert to authenticated with check (author_id=auth.uid() and status='Đang xem xét' and kind in ('Lỗi','Đề xuất'));
create policy votes_read on public.feedback_votes for select to authenticated using (true);
create policy votes_insert on public.feedback_votes for insert to authenticated with check (user_id=auth.uid());
create policy votes_delete on public.feedback_votes for delete to authenticated using (user_id=auth.uid());
create index feedback_created_at on public.feedback(created_at desc);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('feedback-attachments','feedback-attachments',false,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create policy feedback_image_upload on storage.objects for insert to authenticated with check (bucket_id='feedback-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
create policy feedback_image_read on storage.objects for select to authenticated using (bucket_id='feedback-attachments');
-- IT status/category updates use the trusted Supabase administration interface.
-- No client-side UPDATE policy: submitters cannot self-approve or alter others' posts.

commit;

