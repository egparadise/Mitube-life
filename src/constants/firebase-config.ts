/**
 * Firebase 웹 앱 설정 (Firebase 콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정 및 구성).
 * 여기 값들은 비밀이 아니라 "어느 프로젝트인지" 알려 주는 공개 식별자다.
 * 데이터 보호는 Firebase 보안 규칙과 '승인된 도메인'이 맡는다.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyClc6_NWlIkOfCp_UlPDiMecbLX-jbAMGk',
  authDomain: 'hahattalk.firebaseapp.com',
  projectId: 'hahattalk',
  storageBucket: 'hahattalk.firebasestorage.app',
  messagingSenderId: '898541793848',
  appId: '1:898541793848:web:85cbf72ad6cf1ade29accd',
  // measurementId 는 Google Analytics 용. 개인정보처리방침상 지금은 Analytics 를 켜지 않는다.
};
