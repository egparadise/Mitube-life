/**
 * Supabase 클라이언트 (로그인 + 데이터베이스).
 * 연결 정보가 없으면 null — 그때 앱은 로그인 없이 이 기기에만 저장한다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/supabase-config';

if (Platform.OS !== 'web') {
  // 휴대폰(Hermes)에는 URL API 가 완전하지 않아 supabase-js 가 쓰는 부분을 채운다.
  require('react-native-url-polyfill/auto');
}

// 웹 배포 빌드는 페이지를 미리 그릴 때(정적 렌더링) 브라우저가 없는 Node 에서 실행된다.
// 그때는 저장소(localStorage)가 없으므로 세션을 저장·갱신하지 않는다.
const isPrerender = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        ...(isPrerender ? {} : { storage: AsyncStorage }),
        persistSession: !isPrerender,
        autoRefreshToken: !isPrerender,
        // 웹: 구글 로그인 후 돌아온 주소(?code=…)에서 세션을 꺼낸다.
        detectSessionInUrl: Platform.OS === 'web' && !isPrerender,
        flowType: 'pkce',
      },
    })
  : null;

// 휴대폰: 앱이 화면에 있을 때만 세션 자동 갱신 (Supabase 권장 방식).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export class NotConfiguredError extends Error {
  constructor() {
    super('서버(Supabase) 연결 설정이 아직 없어요. 설정을 마치면 가입·로그인할 수 있어요.');
  }
}

/** 연결된 클라이언트를 돌려주고, 없으면 사용자에게 보여 줄 수 있는 오류를 던진다. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new NotConfiguredError();
  return supabase;
}
