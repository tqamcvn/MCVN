-- =====================================================================
--  TQA MCVN — Supabase schema (kiến trúc Supabase Auth + GitHub Pages)
--  Chạy: Supabase Dashboard → SQL Editor → New query → dán hết → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Bảng người dùng + vai trò
-- ---------------------------------------------------------------------
create table if not exists public.app_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  full_name  text,
  role       text not null default 'Member',   -- vd: 'QA Teamleader', 'QA'
  team       text default 'MCVN',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) RLS: user đã đăng nhập CHỈ đọc được dòng của chính mình
-- ---------------------------------------------------------------------
alter table public.app_users enable row level security;

drop policy if exists "read own row" on public.app_users;
create policy "read own row"
  on public.app_users
  for select
  to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );
-- Không có policy insert/update/delete => trình duyệt không sửa được bảng.
-- Bạn tự thêm/sửa thành viên trong Table Editor (chạy bằng quyền admin).

-- ---------------------------------------------------------------------
-- 3) Chặn domain ngay ở tầng database (thật sự, không bypass được)
--    Ai đăng nhập bằng email ngoài danh sách -> Supabase từ chối tạo user.
-- ---------------------------------------------------------------------
create or replace function public.enforce_email_domain()
returns trigger
language plpgsql
security definer
as $$
begin
  if split_part(lower(new.email), '@', 2)
     not in ('shopeemobile-external.com', 'shopee.com') then
    raise exception 'Email domain not allowed: %', new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_domain_trg on auth.users;
create trigger enforce_email_domain_trg
  before insert on auth.users
  for each row execute function public.enforce_email_domain();

-- ---------------------------------------------------------------------
-- 4) Seed thành viên đầu tiên (thêm người khác theo mẫu)
-- ---------------------------------------------------------------------
insert into public.app_users (email, full_name, role, team) values
  ('yennhi.phannguyen.cs@shopeemobile-external.com', 'Phan Nguyễn Yến Nhi', 'QA Teamleader', 'MCVN')
on conflict (email) do nothing;

-- insert into public.app_users (email, full_name, role, team) values
--   ('nguoikhac@shopee.com', 'Tên Hiển Thị', 'QA', 'MCVN')
-- on conflict (email) do nothing;
