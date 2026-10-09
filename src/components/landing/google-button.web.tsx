/**
 * 웹 전용 'Google로 가입 · 로그인' 버튼.
 * 구글 공식 로그인 버튼(Google Identity Services)으로 ID 토큰을 받아 Supabase 에 바로 넘긴다.
 * 리디렉션 방식과 달리 구글 콘솔의 '승인된 리디렉션 URI' 가 필요 없고,
 * '승인된 JavaScript 원본'(localhost:8081, mitube-life.web.app)만 있으면 된다.
 * 처음이면 계정이 자동으로 만들어지고(가입), 다음부터는 같은 버튼으로 로그인된다.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RedirectGoogleButton } from '@/components/landing/google-redirect-button';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { authErrorMessage } from '@/services/auth';
import { GOOGLE_WEB_CLIENT_ID, loadGsi } from '@/services/google-gsi';
import { supabase } from '@/services/supabase';
import { detectEmbeddedBrowser, openInExternalBrowser } from '@/utils/embedded-browser';

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
  const [embedded] = useState(detectEmbeddedBrowser);

  useEffect(() => {
    if (!CLIENT_ID || !supabase || width <= 0 || embedded) return;
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
  }, [dark, width, embedded]);

  // 클라이언트 ID 가 없으면 예전 방식(리디렉션) 버튼을 쓴다.
  if (!CLIENT_ID || !supabase) return <RedirectGoogleButton onPress={onPress} busy={busy} />;

  // 앱 안 브라우저(카톡·인스타·데스크톱 앱 화면 등)는 구글이 로그인을 막는다 → 크롬·사파리로 열도록 안내.
  if (embedded) return <EmbeddedNotice kind={embedded} />;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.wrap}>
      <View ref={holder} style={styles.holder} aria-label="Google 계정으로 가입 또는 로그인" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.altHint}>
        Google 버튼을 눌러도 로그인이 안 되는 화면(Orca 같은 프로그램 안 화면 등)에서는, 크롬에서 Google 로 로그인한 뒤
        설정 → 계정 → 🔑 비밀번호 설정을 하고 여기 위 칸에 이메일 + 그 비밀번호로 로그인하세요.
      </Text>
    </View>
  );
}

const EMBEDDED_NAME: Record<string, string> = {
  kakao: '카카오톡',
  instagram: '인스타그램',
  facebook: '페이스북',
  line: '라인',
  naver: '네이버 앱',
  webview: '앱 안',
  'desktop-app': '이 프로그램 안',
};

/** 앱 안 브라우저 안내: 구글 정책상 여기서는 로그인할 수 없다. */
function EmbeddedNotice({ kind }: { kind: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://mitube-life.web.app';
  const canOpen = kind !== 'desktop-app' && kind !== 'webview' ? true : /Android/i.test(navigator.userAgent);
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>⚠️ {EMBEDDED_NAME[kind] ?? '앱 안'} 브라우저에서는 Google 로그인이 막혀 있어요</Text>
      <Text style={styles.noticeBody}>
        Google 보안 정책 때문에 앱 안에 들어 있는 브라우저에서는 Google 계정으로 로그인할 수 없어요. 크롬(안드로이드)이나
        사파리(아이폰·아이패드)에서 {url.replace(/^https?:\/\//, '')} 을 열어 주세요. 아래 이메일·아이디 로그인은 여기서도 돼요.
      </Text>
      <View style={styles.noticeRow}>
        {canOpen && (
          <Pressable onPress={() => openInExternalBrowser()} style={[styles.noticeBtn, styles.noticePrimary]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>기본 브라우저로 열기</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {});
          }}
          style={styles.noticeBtn}>
          <Text style={{ fontWeight: '700' }}>{copied ? '주소 복사됨' : '주소 복사'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { width: '100%', borderRadius: 14, padding: 14, gap: 8, backgroundColor: '#fff4d6' },
  noticeTitle: { fontWeight: '800', fontSize: 14, color: '#7a4b00' },
  noticeBody: { fontSize: 13, lineHeight: 19, color: '#5c4400' },
  noticeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  noticeBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#ffffff' },
  noticePrimary: { backgroundColor: '#1b2c9e' },
  wrap: { width: '100%', alignItems: 'center', gap: 6 },
  holder: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  altHint: { color: '#8a8f98', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 2 },
});
