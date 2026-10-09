/**
 * 회원가입 · 로그인 (Supabase 인증).
 *
 * 가입 순서 (한국형 가입 폼):
 *   1) 휴대폰 번호로 인증번호 발송  → sendPhoneCode
 *   2) 인증번호 확인               → verifyPhoneCode   (이 순간 휴대폰으로 계정이 만들어지고 로그인된다)
 *   3) 나머지 정보로 가입 완료      → completeSignUp    (아이디·이름·생년월일·성별·이메일·비밀번호)
 * 비밀번호는 Supabase 인증 서버가 암호화해 보관하고, 우리 테이블에는 저장하지 않는다.
 */
import { Platform } from 'react-native';

import { requireSupabase } from '@/services/supabase';
import { toE164Korean } from '@/utils/signup-validation';

/** Supabase 오류를 사용자에게 보여 줄 한국어 문장으로 바꾼다. */
export function authErrorMessage(e: unknown): string {
  const err = e as { code?: string; message?: string; status?: number } | undefined;
  const code = err?.code ?? '';
  const msg = err?.message ?? String(e);
  const map: Record<string, string> = {
    invalid_credentials: '아이디(이메일·휴대폰) 또는 비밀번호가 맞지 않아요.',
    email_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
    user_already_exists: '이미 가입된 회원이에요. 로그인해 주세요.',
    phone_exists: '이미 가입된 휴대폰 번호예요. 로그인해 주세요.',
    otp_expired: '인증번호가 만료됐거나 맞지 않아요. 다시 받아 주세요.',
    over_sms_send_rate_limit: '인증번호를 너무 자주 요청했어요. 잠시 후 다시 시도해 주세요.',
    over_request_rate_limit: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
    sms_send_failed: '문자 발송에 실패했어요. 번호를 확인하거나 잠시 후 다시 시도해 주세요.',
    phone_provider_disabled: '문자 인증이 아직 켜져 있지 않아요 (서버 설정 필요).',
    provider_disabled: '이 로그인 방식이 아직 켜져 있지 않아요 (서버 설정 필요).',
    email_address_invalid: '이메일 주소를 확인해 주세요.',
    weak_password: '비밀번호가 너무 쉬워요. 더 길고 복잡하게 정해 주세요.',
    email_not_confirmed: '이메일 인증을 아직 마치지 않았어요. 메일함을 확인하거나 휴대폰 번호로 로그인해 주세요.',
    phone_not_confirmed: '휴대폰 인증을 아직 마치지 않았어요.',
  };
  if (map[code]) return map[code];
  if (/duplicate key|23505|profiles_username_key/i.test(msg)) return '이미 사용 중인 아이디예요.';
  if (/Failed to fetch|Network request failed/i.test(msg)) return '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
  return msg;
}

/** 아이디 중복 확인. 사용 가능하면 true. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc('is_username_available', {
    p_username: username.trim().toLowerCase(),
  });
  if (error) throw error;
  return data === true;
}

/** 1) 휴대폰으로 인증번호(SMS) 발송. phone 은 +82 형식. */
export async function sendPhoneCode(phone: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true, channel: 'sms' },
  });
  if (error) throw error;
}

/**
 * 2) 인증번호 확인. 성공하면 그 휴대폰 번호의 계정으로 로그인된 상태가 된다.
 * 이미 가입을 마친 번호면 alreadyMember=true (가입 대신 로그인하도록 안내).
 */
export async function verifyPhoneCode(phone: string, code: string): Promise<{ alreadyMember: boolean }> {
  const sb = requireSupabase();
  const { data, error } = await sb.auth.verifyOtp({ phone, token: code.trim(), type: 'sms' });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error('인증은 됐지만 계정 정보를 받지 못했어요. 다시 시도해 주세요.');
  const { data: profile } = await sb.from('profiles').select('username').eq('id', user.id).maybeSingle();
  return { alreadyMember: !!(user.email || profile?.username) };
}

export interface SignUpInput {
  username: string;
  fullName: string;
  /** YYYY-MM-DD */
  birthDate: string;
  gender: 'male' | 'female';
  email: string;
  password: string;
  /** 인증을 마친 휴대폰 번호 (+82…). 문자 인증을 쓰지 않으면 null. */
  phone: string | null;
}

/** 문자(SMS) 인증 사용 여부. Supabase 에 문자 발송 서비스(Twilio 등)를 연결한 뒤 .env 에서 켠다. */
export const SMS_VERIFY_ENABLED = process.env.EXPO_PUBLIC_SMS_ENABLED === 'true';

/**
 * 3) 가입 완료: 회원 정보 저장 → 이메일·비밀번호 설정.
 * 이메일은 확인 메일의 링크를 눌러야 로그인에 쓸 수 있다 (그전엔 휴대폰 번호로 로그인).
 */
export async function completeSignUp(input: SignUpInput): Promise<{ emailConfirmationPending: boolean }> {
  const sb = requireSupabase();
  const { data: auth } = await sb.auth.getUser();
  let user = auth.user;
  if (!user) {
    if (SMS_VERIFY_ENABLED) throw new Error('휴대폰 인증을 먼저 해 주세요.');
    // 문자 인증 없이: 이메일 + 비밀번호로 바로 계정을 만든다 (서버에서 이메일 확인 생략 설정).
    const { data, error } = await sb.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: { data: { username: input.username.trim().toLowerCase(), full_name: input.fullName.trim() } },
    });
    if (error) throw error;
    if (!data.session || !data.user) {
      return { emailConfirmationPending: true };
    }
    user = data.user;
  }

  const now = new Date().toISOString();
  // 아이디 중복은 이 저장에서 최종 확인된다 (중복이면 23505 오류).
  const { error: profileError } = await sb.from('profiles').upsert({
    id: user.id,
    username: input.username.trim().toLowerCase(),
    full_name: input.fullName.trim(),
    birth_date: input.birthDate,
    gender: input.gender,
    email: input.email.trim(),
    phone: user.phone ? `+${user.phone.replace(/^\+/, '')}` : input.phone,
    terms_agreed_at: now,
    privacy_agreed_at: now,
    last_seen_at: now,
  });
  if (profileError) throw profileError;

  if (!user.phone && user.email === input.email.trim()) return { emailConfirmationPending: false };

  const { data: updated, error } = await sb.auth.updateUser({
    email: input.email.trim(),
    password: input.password,
    data: { username: input.username.trim().toLowerCase(), full_name: input.fullName.trim() },
  });
  if (error) throw error;
  const u = updated.user;
  return { emailConfirmationPending: !!u && (u.email !== input.email.trim() || !!u.new_email) };
}

/**
 * 로그인: 아이디 · 이메일 · 휴대폰 번호 + 비밀번호.
 * 아이디 로그인은 서버 함수(login-with-username)가 아이디로 계정을 찾아 대신 로그인한다.
 */
export async function signIn(identifier: string, password: string): Promise<void> {
  const sb = requireSupabase();
  const id = identifier.trim();
  const phone = toE164Korean(id);
  if (phone || id.includes('@')) {
    const { error } = await sb.auth.signInWithPassword(phone ? { phone, password } : { email: id, password });
    if (error) throw error;
    return;
  }
  const { data, error } = await sb.functions.invoke('login-with-username', {
    body: { username: id.toLowerCase(), password },
  });
  if (error) {
    throw new Error(
      '아이디로 로그인하지 못했어요. 아이디·비밀번호를 확인하거나, 이메일 또는 휴대폰 번호로 로그인해 주세요.',
    );
  }
  const { access_token, refresh_token } = (data ?? {}) as { access_token?: string; refresh_token?: string };
  if (!access_token || !refresh_token) throw new Error('아이디 또는 비밀번호가 맞지 않아요.');
  const { error: sessionError } = await sb.auth.setSession({ access_token, refresh_token });
  if (sessionError) throw sessionError;
}

/** 구글 계정으로 계속하기 (웹). 구글 화면으로 이동했다가 이 앱으로 돌아온다. */
export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS !== 'web') {
    throw new Error('휴대폰 앱의 구글 로그인은 앱 빌드 단계에서 붙일 예정이에요. 지금은 웹에서 이용해 주세요.');
  }
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

/**
 * 지금 로그인한 계정에 비밀번호를 정한다 (Google 로 가입한 계정도 가능).
 * Google 창을 띄울 수 없는 곳(Orca 같은 데스크톱 앱 안 화면, 카톡 안 브라우저 등)에서
 * '이메일 + 비밀번호'로 같은 계정에 로그인하려고 쓴다.
 */
export async function setAccountPassword(password: string): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
