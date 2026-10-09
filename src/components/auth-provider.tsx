import type { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { initialSync, resetSyncMemory, startAutoSync } from '@/services/cloud-sync';
import { supabase } from '@/services/supabase';
import { useStore } from '@/store/store';

// 웹: 구글 로그인 팝업이 사이트 첫 화면(/)으로 돌아오면 토큰을 원래 창에 넘기고 팝업을 닫는다.
// 배포 빌드는 화면 모듈을 필요할 때만 불러오므로, 모든 화면에서 항상 불리는 이곳에서 실행해야 한다.
// 단, 로그인 결과(state=…)를 들고 돌아온 '팝업 창'에서만 실행한다. 같은 사이트의 다른 탭이
// 진행 중인 로그인 기록을 덮어쓰지 않도록.
if (
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.opener &&
  /[#?&]state=/.test(window.location.href)
) {
  try {
    WebBrowser.maybeCompleteAuthSession();
  } catch {
    // 원래 창이 새로고침되어 돌려줄 곳이 없으면 그냥 둔다 (사용자가 팝업을 닫으면 된다).
  }
}

export interface Profile {
  username: string | null;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  /** 회원 등급. 관리자는 Supabase SQL Editor 에서만 지정한다 (supabase/make-admin.sql). */
  role?: 'member' | 'admin' | null;
}

interface AuthValue {
  /** Supabase 연결 정보가 있는지 (없으면 가입·로그인 불가, 이 기기에만 저장). */
  configured: boolean;
  /** 저장된 로그인 상태 확인을 마쳤는지. */
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue>({
  configured: false,
  ready: true,
  session: null,
  profile: null,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

/** 로그인 상태를 앱 전체에 알려 주고, 로그인하면 클라우드 동기화를 켜고 끈다. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const hydrated = useStore((s) => s.hydrated);
  const signupInProgress = useStore((s) => s.signupInProgress);
  const cloudSyncOn = useStore((s) => s.adminSettings.cloudSyncOn);
  const uid = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    // 이 콜백 안에서는 다른 supabase 호출을 하지 않는다 (Supabase 권장 — 교착 방지).
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !uid) {
      setProfile(null);
      setProfileLoaded(!uid);
      return;
    }
    const cols = 'username, full_name, display_name, email, phone, avatar_url';
    let { data, error } = await supabase
      .from('profiles')
      .select(`${cols}, role`)
      .eq('id', uid)
      .maybeSingle();
    // role 칸이 없는 예전 스키마로 만든 DB 에서도 프로필은 읽히도록 (없으면 일반 회원으로 본다).
    if (error) ({ data } = await supabase.from('profiles').select(cols).eq('id', uid).maybeSingle());
    setProfile((data as Profile | null) ?? null);
    setProfileLoaded(true);
  }, [uid]);

  useEffect(() => {
    setProfileLoaded(false);
    refreshProfile();
  }, [refreshProfile]);

  // 휴대폰 인증만 하고 가입을 마치지 않은 계정은 로그인 상태로 남겨 두지 않는다.
  useEffect(() => {
    if (!supabase || !session || signupInProgress || !profileLoaded) return;
    const u = session.user;
    const phoneOnly = !u.email && !!u.phone && u.app_metadata?.provider === 'phone';
    if (phoneOnly && !profile?.username) supabase.auth.signOut();
  }, [session, profile, profileLoaded, signupInProgress]);

  // 로그인돼 있으면 소개 화면은 건너뛴다 (재방문 · 구글 로그인에서 돌아온 경우).
  useEffect(() => {
    if (session && !signupInProgress) useStore.getState().setIntroDone(true);
  }, [session, signupInProgress]);

  // 로그인 → 클라우드와 맞추고 자동 동기화 시작 / 로그아웃 → 멈춤.
  useEffect(() => {
    if (!uid || !hydrated || signupInProgress || !cloudSyncOn) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    const { setSyncState } = useStore.getState();
    (async () => {
      setSyncState({ syncStatus: 'syncing', syncError: '' });
      try {
        await initialSync(uid);
        if (cancelled) return;
        setSyncState({ syncStatus: 'synced', lastSyncedAt: Date.now() });
        stop = startAutoSync(uid);
      } catch (e) {
        if (!cancelled) setSyncState({ syncStatus: 'error', syncError: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
      resetSyncMemory();
      useStore.getState().setSyncState({ syncStatus: 'off' });
    };
  }, [uid, hydrated, signupInProgress, cloudSyncOn]);

  return (
    <AuthContext.Provider value={{ configured: !!supabase, ready, session, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
