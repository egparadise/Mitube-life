/**
 * Supabase 연결 정보 (Supabase 대시보드 → Project Settings → API).
 * 프로젝트 루트의 .env 파일에 넣는다:
 *   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   (anon / publishable 키 — 공개용 키, service_role 키는 절대 넣지 말 것)
 * 비어 있으면 앱은 로그인 없이(이 기기에만 저장) 동작한다.
 */
export const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
export const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export const isSupabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
