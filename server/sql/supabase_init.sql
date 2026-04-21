-- =========================
-- 0) 扩展
-- =========================
create extension if not exists pgcrypto;
create extension if not exists citext;

-- =========================
-- 1) 角色枚举
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'student');
  end if;
end$$;

-- =========================
-- 2) 用户表（管理员 + 学生）
-- =========================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  password_hash text not null,
  role user_role not null,
  full_name text not null default '',
  email citext unique,
  phone text,
  student_no text unique,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users(id) on delete set null,
  updated_by uuid references public.users(id) on delete set null,
  constraint ck_student_no check (
    (role = 'student' and student_no is not null and length(student_no) > 0)
    or role = 'admin'
  )
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_active on public.users(is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- =========================
-- 3) 默认管理员（首次）
-- 账号: admin
-- 初始密码: admin@123456
-- =========================
insert into public.users (
  username, password_hash, role, full_name, must_change_password, is_active
)
select
  'admin',
  crypt('admin@123456', gen_salt('bf', 10)),
  'admin',
  '系统管理员',
  true,
  true
where not exists (
  select 1 from public.users where username = 'admin'
);

-- =========================
-- 4) 学生批量导入表
-- =========================
create table if not exists public.student_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  status text not null default 'pending',
  total_rows int not null default 0,
  success_rows int not null default 0,
  failed_rows int not null default 0,
  overwrite_existing boolean not null default false,
  error_message text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_student_import_batches_updated_at on public.student_import_batches;
create trigger trg_student_import_batches_updated_at
before update on public.student_import_batches
for each row
execute function public.set_updated_at();

create table if not exists public.student_import_rows (
  id bigserial primary key,
  batch_id uuid not null references public.student_import_batches(id) on delete cascade,
  row_no int not null,
  username citext,
  password_plain text,
  full_name text,
  email citext,
  phone text,
  student_no text,
  imported boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  unique (batch_id, row_no)
);

create index if not exists idx_student_import_rows_batch on public.student_import_rows(batch_id);

-- =========================
-- 5) 批量导入函数
-- =========================
create or replace function public.import_students_from_batch(
  p_batch_id uuid,
  p_operator_user_id uuid,
  p_overwrite boolean default false
)
returns table(inserted_count int, updated_count int, failed_count int)
language plpgsql
as $$
declare
  r record;
  v_inserted int := 0;
  v_updated int := 0;
  v_failed int := 0;
begin
  update public.student_import_batches
    set status = 'processing',
        overwrite_existing = p_overwrite,
        error_message = null
  where id = p_batch_id;

  for r in
    select * from public.student_import_rows
    where batch_id = p_batch_id
    order by row_no
  loop
    if coalesce(trim(r.username::text), '') = ''
       or coalesce(trim(r.password_plain), '') = ''
       or coalesce(trim(r.full_name), '') = ''
       or coalesce(trim(r.student_no), '') = '' then
      update public.student_import_rows
        set imported = false, error_message = 'username/password/full_name/student_no 不能为空'
      where id = r.id;
      v_failed := v_failed + 1;
      continue;
    end if;

    if exists (select 1 from public.users u where u.username = r.username) then
      if p_overwrite then
        update public.users
           set password_hash = crypt(r.password_plain, gen_salt('bf', 10)),
               role = 'student',
               full_name = r.full_name,
               email = r.email,
               phone = r.phone,
               student_no = r.student_no,
               is_active = true,
               updated_by = p_operator_user_id
         where username = r.username;

        update public.student_import_rows
          set imported = true, error_message = null
        where id = r.id;

        v_updated := v_updated + 1;
      else
        update public.student_import_rows
          set imported = false, error_message = 'username 已存在'
        where id = r.id;

        v_failed := v_failed + 1;
      end if;
    else
      begin
        insert into public.users (
          username, password_hash, role, full_name, email, phone, student_no,
          is_active, must_change_password, created_by, updated_by
        ) values (
          r.username,
          crypt(r.password_plain, gen_salt('bf', 10)),
          'student',
          r.full_name,
          r.email,
          r.phone,
          r.student_no,
          true,
          true,
          p_operator_user_id,
          p_operator_user_id
        );

        update public.student_import_rows
          set imported = true, error_message = null
        where id = r.id;

        v_inserted := v_inserted + 1;
      exception when others then
        update public.student_import_rows
          set imported = false, error_message = sqlerrm
        where id = r.id;

        v_failed := v_failed + 1;
      end;
    end if;
  end loop;

  update public.student_import_batches
    set status = 'done',
        total_rows = coalesce((select count(*) from public.student_import_rows where batch_id = p_batch_id), 0),
        success_rows = v_inserted + v_updated,
        failed_rows = v_failed
  where id = p_batch_id;

  return query select v_inserted, v_updated, v_failed;
exception when others then
  update public.student_import_batches
    set status = 'failed',
        error_message = sqlerrm
  where id = p_batch_id;
  raise;
end;
$$;

-- =========================
-- 6) 登录校验函数
-- =========================
create or replace function public.verify_user_login(
  p_username text,
  p_password text
)
returns table(
  id uuid,
  username citext,
  role user_role,
  full_name text,
  email citext,
  is_active boolean,
  must_change_password boolean
)
language sql
stable
as $$
  select u.id, u.username, u.role, u.full_name, u.email, u.is_active, u.must_change_password
  from public.users u
  where u.username = p_username
    and u.is_active = true
    and u.password_hash = crypt(p_password, u.password_hash);
$$;

