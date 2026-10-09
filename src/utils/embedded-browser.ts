/**
 * 앱 안 브라우저(카카오톡·인스타그램·페이스북·라인·네이버 앱, 안드로이드 WebView, Electron 데스크톱 앱 등) 감지.
 * 구글은 보안 정책상 이런 '내장 브라우저'에서의 로그인을 막는다 (403 disallowed_useragent,
 * "이 브라우저 또는 앱은 안전하지 않을 수 있습니다"). 그래서 크롬·사파리로 다시 열도록 안내한다.
 */
import { Platform } from 'react-native';

export type EmbeddedKind = 'kakao' | 'instagram' | 'facebook' | 'line' | 'naver' | 'webview' | 'desktop-app' | null;

export function detectEmbeddedBrowser(): EmbeddedKind {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) return 'kakao';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/\bLine\//i.test(ua)) return 'line';
  if (/NAVER\(inapp|NAVER\//i.test(ua)) return 'naver';
  if (/Electron\//i.test(ua)) return 'desktop-app';
  // 안드로이드 WebView 는 'wv' 표시, iOS WebView 는 'Safari' 토큰이 없다.
  if (/Android.+; wv\)/i.test(ua)) return 'webview';
  if (/iPhone|iPad|iPod/i.test(ua) && !/Safari\//i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) return 'webview';
  return null;
}

/** 지금 주소를 기기의 기본 브라우저(크롬·사파리)로 다시 연다. 안 되면 false. */
export function openInExternalBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const url = window.location.href;
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    return true;
  }
  if (/Android/i.test(ua)) {
    const noScheme = url.replace(/^https?:\/\//, '');
    window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`;
    return true;
  }
  return false;
}
