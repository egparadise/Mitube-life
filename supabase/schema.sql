-- ============================================================
-- 마이 튜브 · Supabase 데이터베이스 스키마
-- 사용법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여넣고 Run.
-- 여러 번 실행해도 안전하다 (if not exists / or replace / drop ... if exists).
-- ============================================================

-- 1) 가입자 정보 ------------------------------------------------
--    주민등록번호는 저장하지 않는다. 앞 6자리 + 뒷자리 첫 숫자로 계산한 생년월일·성별만 둔다.
--    비밀번호는 Supabase 인증(auth.users)이 암호화해서 보관한다 — 이 테이블에는 없다.
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  username           text,                 -- 아이디 (영문 소문자로 시작, 영문 소문자·숫자·_ 4~20자)
  full_name          text,                 -- 이름
  birth_date         date,                 -- 생년월일
  gender             text,                 -- 'male' | 'female'
  email              text,
  phone              text,                 -- 인증을 마친 휴대폰 번호 (+8210...)
  display_name       text,                 -- 구글 로그인 시 구글 이름
  avatar_url         text,
  terms_agreed_at    timestamptz,          -- 이용약관 동의 시각
  privacy_agreed_at  timestamptz,          -- 개인정보 수집·이용 동의 시각
  created_at         timestamptz not null default now(),
  last_seen_at       timestamptz not null default now()
);
-- 예전 버전으로 이미 만든 테이블에도 새 칸을 더한다.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists terms_agreed_at timestamptz;
alter table public.profiles add column if not exists privacy_agreed_at timestamptz;

create unique index if not exists profiles_username_key on public.profiles (lower(username));
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z][a-z0-9_]{3,19}$');
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check
  check (gender is null or gender in ('male', 'female'));

-- 회원 등급: 'member'(일반) | 'admin'(관리자). 가입하면 항상 member.
-- 앱(로그인한 사용자)에서는 등급을 바꿀 수 없고, 대시보드 SQL Editor 에서만 바꾼다 (supabase/make-admin.sql).
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'admin'));

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- 로그인한 사용자의 요청(auth.uid() 가 있음)이면 등급을 올리거나 바꾸지 못하게 한다.
  -- SQL Editor·서비스 키처럼 사용자 없이 실행하면 auth.uid() 가 null 이라 바꿀 수 있다.
  if (select auth.uid()) is not null then
    if tg_op = 'INSERT' then
      new.role := 'member';
    elsif new.role is distinct from old.role then
      raise exception '회원 등급(role)은 관리자만 바꿀 수 있습니다';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- 2) 가입자 환경 (앱 설정) --------------------------------------
--    액세스 토큰 같은 민감한 값은 저장하지 않는다 (기기에만 둔다).
create table if not exists public.user_settings (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  google_client_id   text,
  youtube_connected  boolean not null default false,
  baseline_at        bigint,                              -- 새 영상 기준 시각 (ms)
  last_checked_at    bigint,                              -- 마지막 새 영상 확인 (ms)
  seen_at            jsonb not null default '{}'::jsonb,  -- 분류함별 '본 시각'
  prefs              jsonb not null default '{}'::jsonb,  -- 그 밖의 환경 설정
  updated_at         timestamptz not null default now()
);

-- 3) 분류함 (하위 분류함 포함) ----------------------------------
create table if not exists public.categories (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  name        text not null,
  emoji       text not null default '📁',
  color       text not null,
  sort_order  integer not null default 0,
  parent_id   text,                                   -- 하위 분류함이면 상위 id
  icon_url    text,                                   -- AI 로 만든 아이콘 (있으면)
  keywords    text[],
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- 4) 구독 채널 --------------------------------------------------
create table if not exists public.channels (
  user_id           uuid not null references auth.users (id) on delete cascade,
  id                text not null,                    -- YouTube 채널 id (UC...)
  title             text not null,
  description       text not null default '',
  thumbnail         text,
  subscriber_count  bigint,
  category_id       text,                             -- null = 미분류
  updated_at        timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists channels_user_category_idx on public.channels (user_id, category_id);

-- 5) 채널별 '볼 시간' 알림 --------------------------------------
create table if not exists public.channel_alerts (
  user_id     uuid not null references auth.users (id) on delete cascade,
  channel_id  text not null,
  freq        text not null check (freq in ('daily', 'weekly', 'monthly')),
  hour        smallint not null check (hour between 0 and 23),
  minute      smallint not null check (minute between 0 and 59),
  weekday     smallint not null default 1 check (weekday between 1 and 7),   -- 1=일 … 7=토
  month_day   smallint not null default 1 check (month_day between 1 and 28),
  updated_at  timestamptz not null default now(),
  primary key (user_id, channel_id)
);

-- ============================================================
-- 보안: 행 수준 보안(RLS) — 로그인한 본인 데이터만 읽고 쓸 수 있다.
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.user_settings   enable row level security;
alter table public.categories      enable row level security;
alter table public.channels        enable row level security;
alter table public.channel_alerts  enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "own settings" on public.user_settings;
create policy "own settings" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own channels" on public.channels;
create policy "own channels" on public.channels
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own alerts" on public.channel_alerts;
create policy "own alerts" on public.channel_alerts
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ============================================================
-- 가입(계정 생성) 순간 profiles · user_settings 행을 자동으로 만든다.
-- 휴대폰 인증으로 먼저 계정이 생기는 경우에도, 구글 로그인인 경우에도 동작한다.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 운영자 이메일로 처음 가입하면 바로 관리자, 나머지는 일반 회원.
  insert into public.profiles (id, email, phone, display_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case when lower(coalesce(new.email, '')) = 'egparadise@gmail.com' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 가입 화면의 아이디 중복 확인 (로그인 전에도 호출 가능).
-- 사용 가능 여부(true/false)만 알려 주고 다른 정보는 내보내지 않는다.
-- ============================================================
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(p_username))
  );
$$;
revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
