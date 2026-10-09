-- ============================================================
-- 마이 튜브 · 관리자 지정
-- 사용법:
--   1) 먼저 앱에서 그 이메일의 구글 계정으로 한 번 로그인("Google로 계속하기")한다.
--   2) Supabase 대시보드 → SQL Editor → New query → 아래를 붙여넣고 Run.
-- 비밀번호는 여기에 쓰지 않는다. 로그인은 구글 계정(또는 앱의 가입 화면)으로만 한다.
--
-- 보안: profiles.email 은 사용자가 앱에서 고칠 수 있는 칸이라 믿지 않는다.
--       Supabase 인증(auth.users)에 확인된 이메일이면서, 구글 로그인으로 연결된 계정만 관리자로 만든다.
-- ============================================================

do $$
declare
  admin_email constant text := 'egparadise@gmail.com';
  target uuid;
  matches int;
begin
  select count(*), min(u.id::text)::uuid
    into matches, target
  from auth.users u
  where lower(u.email) = lower(admin_email)
    and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
    );

  if matches = 0 then
    raise exception '% 로 구글 로그인한 계정이 없어요. 앱에서 "Google로 계속하기"로 먼저 로그인해 주세요.', admin_email;
  elsif matches > 1 then
    raise exception '% 계정이 여러 개예요. Authentication → Users 에서 확인해 주세요.', admin_email;
  end if;

  update public.profiles set role = 'admin' where id = target;
  if not found then
    raise exception '프로필 행이 없어요. 앱에 한 번 더 로그인한 뒤 다시 실행해 주세요.';
  end if;
  raise notice '관리자로 지정했어요: % (%)', admin_email, target;
end
$$;

-- 확인: role 이 admin 으로 나오면 완료.
select p.id, u.email, p.display_name, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
