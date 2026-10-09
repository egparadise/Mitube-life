/**
 * 구글 공식 웹 로그인 스크립트(Google Identity Services) — 웹 전용.
 * - 계정 로그인 버튼: components/landing/google-button.web.tsx
 * - YouTube 읽기 권한(액세스 토큰) 받기: requestYouTubeAccessToken
 * 둘 다 구글 콘솔의 '승인된 JavaScript 원본'만 있으면 되고 리디렉션 URI 가 필요 없다.
 */
import { Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_ID = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '').trim();
const GSI_SRC = 'https://accounts.google.com/gsi/client';
const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';

export interface GsiApi {
  accounts: {
    id: {
      initialize: (cfg: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
    oauth2: {
      initTokenClient: (cfg: Record<string, unknown>) => { requestAccessToken: (o?: Record<string, unknown>) => void };
    };
  };
}

let gsiLoading: Promise<GsiApi> | null = null;

export function loadGsi(): Promise<GsiApi> {
  const w = window as unknown as { google?: GsiApi };
  if (w.google?.accounts?.id) return Promise.resolve(w.google);
  gsiLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error('구글 로그인을 불러오지 못했어요.')));
    s.onerror = () => {
      gsiLoading = null;
      reject(new Error('구글 로그인을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));
    };
    document.head.appendChild(s);
  });
  return gsiLoading;
}

/** 이 환경에서 구글 창으로 YouTube 권한을 받을 수 있는지 (웹 + 클라이언트 ID 설정). */
export const canRequestYouTubeToken = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && GOOGLE_WEB_CLIENT_ID.length > 0;

/**
 * 구글 창을 띄워 'YouTube 읽기 전용' 액세스 토큰(약 1시간)을 받는다.
 * 사용자 클릭 직후에 불러야 브라우저가 창을 막지 않는다. 이미 허락한 계정이면 창이 바로 닫힌다.
 */
export async function requestYouTubeAccessToken(loginHint?: string): Promise<{ token: string; expiresAt: number }> {
  const google = await loadGsi();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_WEB_CLIENT_ID,
      scope: YOUTUBE_SCOPE,
      ...(loginHint ? { login_hint: loginHint } : {}),
      callback: (resp: { access_token?: string; expires_in?: number | string; error?: string }) => {
        if (!resp.access_token) {
          reject(new Error(resp.error === 'access_denied' ? 'YouTube 권한을 허락하지 않았어요.' : 'YouTube 연결에 실패했어요.'));
          return;
        }
        resolve({ token: resp.access_token, expiresAt: Date.now() + Number(resp.expires_in ?? 3600) * 1000 });
      },
      error_callback: (err: { type?: string }) =>
        reject(new Error(err?.type === 'popup_closed' ? 'YouTube 연결 창을 닫았어요.' : '구글 창을 열지 못했어요. 팝업 차단을 확인해 주세요.')),
    });
    client.requestAccessToken({ prompt: '' });
  });
}
