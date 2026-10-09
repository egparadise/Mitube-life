// 아이디 + 비밀번호 로그인 (Supabase Edge Function).
// 앱에서 이메일을 몰라도 아이디로 로그인할 수 있게, 서버에서 아이디 → 계정을 찾아 대신 로그인한다.
// 이메일·전화번호는 앱에 돌려주지 않고, 성공하면 세션 토큰만 돌려준다.
// 배포: supabase functions deploy login-with-username
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const fail = () =>
  // 아이디가 없는 경우와 비밀번호가 틀린 경우를 구분하지 않는다 (아이디 존재 여부 노출 방지).
  new Response(JSON.stringify({ error: 'invalid_credentials' }), {
    status: 400,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return fail();

  let username = '';
  let password = '';
  try {
    const body = await req.json();
    username = String(body.username ?? '').trim().toLowerCase();
    password = String(body.password ?? '');
  } catch {
    return fail();
  }
  if (!/^[a-z][a-z0-9_]{3,19}$/.test(username) || password.length < 8) return fail();

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data: profile } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
  if (!profile) return fail();

  // 인증 서버에 저장된(확인된) 이메일·휴대폰으로 로그인한다.
  const { data: found } = await admin.auth.admin.getUserById(profile.id);
  const user = found?.user;
  if (!user) return fail();

  const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
  const credentials =
    user.email && user.email_confirmed_at
      ? { email: user.email, password }
      : user.phone
        ? { phone: user.phone, password }
        : null;
  if (!credentials) return fail();

  const { data, error } = await anon.auth.signInWithPassword(credentials);
  if (error || !data.session) return fail();

  return new Response(
    JSON.stringify({ access_token: data.session.access_token, refresh_token: data.session.refresh_token }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } },
  );
});
