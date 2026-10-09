/**
 * Firebase 연결.
 * - 웹 배포는 Firebase Hosting (firebase.json, `npm run deploy:web`).
 * - 이후 휴대폰 푸시 알림(FCM)도 이 앱 인스턴스를 쓴다.
 * 로그인·데이터는 Supabase 가 맡는다 (src/services/supabase.ts).
 * Google Analytics 는 개인정보처리방침상 켜지 않는다.
 */
import { getApp, getApps, initializeApp } from 'firebase/app';

import { firebaseConfig } from '@/constants/firebase-config';

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
