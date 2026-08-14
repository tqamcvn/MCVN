-- =====================================================================
--  TQA MCVN — Supabase schema (chạy lại được nhiều lần, an toàn)
--  Supabase → SQL Editor → New query → dán hết → Run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Bảng người dùng + vai trò
-- ---------------------------------------------------------------------
create table if not exists public.app_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  full_name  text,
  role       text not null default 'Member',
  team       text default 'MCVN',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2) RLS: user đã đăng nhập chỉ đọc được dòng của chính mình
-- ---------------------------------------------------------------------
alter table public.app_users enable row level security;

drop policy if exists "read own row" on public.app_users;
create policy "read own row"
  on public.app_users
  for select
  to authenticated
  using ( lower(email) = lower(auth.jwt() ->> 'email') );

-- ---------------------------------------------------------------------
-- 3) Danh sách người được vào + vai trò (nguồn dữ liệu chính)
--    Chạy lại sẽ cập nhật role nếu có thay đổi.
-- ---------------------------------------------------------------------
insert into public.app_users (email, role) values
  ('kimthu.quach@shopeemobile-external.com','OM'),
  ('hoainhung.le.cs@shopeemobile-external.com','Assistant OM'),
  ('vy.huynhkhanh.cs@shopeemobile-external.com','Assistant OM'),
  ('yennhi.tranthi.cs@shopeemobile-external.com','Assistant OM'),
  ('thuy.nguyenngocthu1.cs@shopeemobile-external.com','Assistant OM'),
  ('nguyenthithuminh2.cs@shopeemobile-external.com','Assistant OM'),
  ('huy.phanthanhbao2.cs@shopeemobile-external.com','Assistant OM'),
  ('hung.vo@shopeemobile-external.com','Supervisor'),
  ('thanh.nguyen.cs@shopeemobile-external.com','Supervisor'),
  ('dainghia.nguyen.cs@shopeemobile-external.com','Teamlead'),
  ('quocviet.tran.cs@shopeemobile-external.com','Teamlead'),
  ('dan.dinh.cs@shopeemobile-external.com','Teamlead'),
  ('linh.nguyen.cs@shopeemobile-external.com','Teamlead'),
  ('thumai.nguyen@shopeemobile-external.com','Teamlead'),
  ('minhmang.nguyen.cs@shopeemobile-external.com','Teamlead'),
  ('kimthanh.huynh.cs@shopeemobile-external.com','Teamlead'),
  ('ngocmy.lebui.cs@shopeemobile-external.com','Teamlead'),
  ('thithuyduong.le.cs@shopeemobile-external.com','Teamlead'),
  ('nguyenthi.anhhong.cs@shopeemobile-external.com','Teamlead'),
  ('na.duongvanhuy1.cs@shopeemobile-external.com','Teamlead'),
  ('tran.lamhieu1.cs@shopeemobile-external.com','Teamlead'),
  ('hien.phamthu1.cs@shopeemobile-external.com','Teamlead'),
  ('ngocquy.tranthi.cs@shopeemobile-external.com','Sup TQA'),
  ('nguyenthithienkim2.cs@shopeemobile-external.com','Senior TQA'),
  ('yennhi.phannguyen.cs@shopeemobile-external.com','TL TQA'),
  ('chau.nguyenthi.cs@shopeemobile-external.com','TQA'),
  ('nhatphuong.phan.cs@shopeemobile-external.com','TQA'),
  ('nghia.an.cs@shopeemobile-external.com','TL TQA'),
  ('phuoctoan.tu.cs@shopeemobile-external.com','Acting TL TQA'),
  ('kimthoa.nguyen.cs@shopeemobile-external.com','Senior TQA'),
  ('yenlinh.daophan.cs@shopeemobile-external.com','TQA'),
  ('thanhphuong.lethi.cs@shopeemobile-external.com','TQA'),
  ('ngoc.vu.hoang.cs@shopeemobile-external.com','TQA'),
  ('thuyduong.dang.cs@shopeemobile-external.com','TQA'),
  ('duykhanh.trangia.cs@shopeemobile-external.com','TQA'),
  ('linh.nguyenhoanglam1.cs@shopeemobile-external.com','TQA'),
  ('thu.nguyenthiminh1.cs@shopeemobile-external.com','Senior TQA'),
  ('oanh.nguyenthikieu1.cs@shopeemobile-external.com','Senior TQA'),
  ('thuonggiang.lenguyen.cs@shopeemobile-external.com','TQA'),
  ('thuy.buithanh1.cs@shopeemobile-external.com','Trainer'),
  ('kien.duonggia1.cs@shopeemobile-external.com','TQA'),
  ('nguyen.votrung1.cs@shopeemobile-external.com','TQA'),
  ('quy.lenguyenminh1.cs@shopeemobile-external.com','TQA'),
  ('thaovan.lethi.cs@shopeemobile-external.com','TQA'),
  ('vu.letuan1.cs@shopeemobile-external.com','TQA'),
  ('saoly.luong@shopeemobile-external.com','Senior'),
  ('thanh.hai.tran.cs@shopeemobile-external.com','Senior'),
  ('nguyen.myduyen.cs@shopeemobile-external.com','Senior'),
  ('dieu.hien.mai.cs@shopeemobile-external.com','Senior'),
  ('hong.van.nguyen.thi.cs@shopeemobile-external.com','Senior'),
  ('quoc.ky.nguyen.cs@shopeemobile-external.com','Senior'),
  ('huynhmy.nguyen.cs@shopeemobile-external.com','Senior'),
  ('quynhnhi.le.cs@shopeemobile-external.com','Senior'),
  ('thuytien.ho.ngoc.cs@shopeemobile-external.com','Senior'),
  ('anhthu.nguyenhuynh.cs@shopeemobile-external.com','Senior'),
  ('thanh.dinhthihoai1.cs@shopeemobile-external.com','Senior'),
  ('huunguyen.hovinh.cs@shopeemobile-external.com','Senior'),
  ('hao.huynhanh.cs@shopeemobile-external.com','Senior Support'),
  ('ngocphuong.nguyen.cs@shopeemobile-external.com','Senior Support'),
  ('thao.nguyenthu.cs@shopeemobile-external.com','Senior Support'),
  ('khanh.nguyenduy.cs@shopeemobile-external.com','Senior Support'),
  ('ngoctrann.nguyen.cs@shopeemobile-external.com','Senior Support'),
  ('giavy.nguyenphan.cs@shopeemobile-external.com','Senior Support'),
  ('mai.phanthithanh1.cs@shopeemobile-external.com','Senior Support'),
  ('hung.vodinh1.cs@shopeemobile-external.com','Senior Support'),
  ('phuonghoa.dodang.cs@shopeemobile-external.com','Senior Support'),
  ('ngocthuy.nguyen.ngoc.cs@shopeemobile-external.com','Senior Support'),
  ('anh.lethiphuong.cs@shopeemobile-external.com','Senior Support'),
  ('nguyen.linhthao.cs@shopeemobile-external.com','Senior Support'),
  ('trong.huynhngoc1.cs@shopeemobile-external.com','Senior Support'),
  ('loc.nguyenphuoc1.cs@shopeemobile-external.com','Senior Support'),
  ('thuyquyen.nguyen.thi.cs@shopeemobile-external.com','Senior Support'),
  ('tien.luuthao1.cs@shopeemobile-external.com','Senior Support'),
  ('tan.lieuphuong1.cs@shopeemobile-external.com','Senior Support'),
  ('bao.lamvu1.cs@shopeemobile-external.com','Senior Support')
on conflict (email) do update set role = excluded.role;

-- ---------------------------------------------------------------------
-- 4) Chặn truy cập ở tầng database (thật, không bypass được)
--    Cho vào nếu: domain @shopee.com  HOẶC  email có trong app_users.
--    Còn lại -> từ chối tạo tài khoản.
-- ---------------------------------------------------------------------
create or replace function public.enforce_access()
returns trigger
language plpgsql
security definer
as $$
declare dom text := split_part(lower(new.email), '@', 2);
begin
  if dom = 'shopee.com' then
    return new;                                   -- mọi @shopee.com (role IH)
  elsif exists (select 1 from public.app_users
                where lower(email) = lower(new.email)) then
    return new;                                   -- email trong danh sách
  else
    raise exception 'Email chua duoc cap quyen: %', new.email;
  end if;
end;
$$;

-- gỡ trigger cũ (tên khác ở bản trước) nếu có, rồi tạo trigger mới
drop trigger if exists enforce_email_domain_trg on auth.users;
drop trigger if exists enforce_access_trg on auth.users;
create trigger enforce_access_trg
  before insert on auth.users
  for each row execute function public.enforce_access();
