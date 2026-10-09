/**
 * 웹 전용 'Google로 가입 · 로그인' 버튼.
 * 구글 공식 로그인 버튼(Google Identity Services)으로 ID 토큰을 받아 Supabase 에 바로 넘긴다.
 * 리디렉션 방식과 달리 구글 콘솔의 '승인된 리디렉션 URI' 가 필요 없고,
 * '승인된 JavaScript 원본'(localhost:8081, mitube-life.web.app)만 있으면 된다.
 * 처음이면 계정이 자동으로 만들어지고(가입), 다음부터는 같은 버튼으로 로그인된다.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { RedirectGoogleButton } from '@/components/landing/google-redirect-button';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authErrorMessage } from '@/services/auth';
import { GOOGLE_WEB_CLIENT_ID, loadGsi } from '@/services/google-gsi';
import { supabase } from '@/services/supabase';

const CLIENT_ID = GOOGLE_WEB_CLIENT_ID;

/** 원래 nonce → SHA-256 hex (구글에는 해시를, Supabase 에는 원래 값을 준다). */
async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function GoogleButton({ onPress, busy }: { onPress: () => void; busy?: boolean }) {
  const holder = useRef<View>(null);
  const dark = useColorScheme() === 'dark';
  const [error, setError] = useState('');
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!CLIENT_ID || !supabase || width <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const google = await loadGsi();
        if (cancelled) return;
        const rawNonce = crypto.randomUUID();
        const hashedNonce = await sha256Hex(rawNonce);
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashedNonce,
          use_fedcm_for_button: true,
          callback: async (resp: { credential?: string }) => {
            setError('');
            if (!resp.credential) {
              setError('구글 로그인이 취소됐어요.');
              return;
            }
            const { error: e } = await supabase!.auth.signInWithIdToken({
              provider: 'google',
              token: resp.credential,
              nonce: rawNonce,
            });
            if (e) setError(authErrorMessage(e));
          },
        });
        const el = holder.current as unknown as HTMLElement | null;
        if (!el) return;
        el.innerHTML = '';
        google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          locale: 'ko',
          width: Math.min(400, Math.max(200, Math.round(width))),
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dark, width]);

  // 클라이언트 ID 가 없으면 예전 방식(리디렉션) 버튼을 쓴다.
  if (!CLIENT_ID || !supabase) return <RedirectGoogleButton onPress={onPress} busy={busy} />;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wrap}>
      <View ref={holder} style={styles.holder} aria-label="Google 계정으로 가입 또는 로그인" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: 6 },
  holder: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
});
