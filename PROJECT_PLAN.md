# 마이 튜브 (Favorit YouTube) — 프로젝트 계획

내 YouTube 구독 채널을 **내가 만든 카테고리로 자동 분류**하고, 자유롭게 옮기며,
새 영상 알림 · 노션 요약 · SNS 공유까지 하는 앱.
**iOS · 안드로이드 · 웹** 한 코드베이스로 만든다.

---

## 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 프론트(앱) | **Expo (React Native) + expo-router** | 하나의 코드로 iOS/안드로이드/웹. 윈도우에서 개발, EAS로 Mac 없이 iOS 빌드 |
| 상태/저장 | zustand + AsyncStorage | 가볍고, 기기에 자동 저장 (웹은 localStorage) |
| 백엔드(예정) | Node(예: Supabase/Fastify) + DB | OAuth 토큰 보관, 새 영상 폴링, 푸시 발송, 노션/AI 호출 |
| AI 요약/분류(예정) | Claude API | 채널 자동 분류 고도화 + 영상 핵심 요약 |

> **왜 백엔드가 필요한가:** 푸시 알림(새 영상 감지), OAuth 비밀키 보관, 노션·카카오 토큰,
> AI 요약은 모두 보안상/구조상 서버에서 처리해야 한다. 핵심 분류 화면(Phase 1)은 서버 없이 동작한다.

---

## 단계별 로드맵

### ✅ Phase 1 — 핵심 분류 (완료, 현재 빌드)
- 분류함(카테고리) 직접 생성·수정·삭제 (이름·아이콘·색상)
- 구독 채널을 분류함에 **자동 배정**(현재는 규칙 기반) + **수동 이동**
- 미분류함, 기기 저장(껐다 켜도 유지)
- **데모 데이터**로 전체 흐름 동작 (실제 YouTube 연결 전)
- 웹·iOS·안드로이드 공용 UI

### 🔄 Phase 2 — 실제 YouTube 연결 (앱 코드 완료, 사용자 구글 설정 대기)
- 앱: OAuth 로그인 + `subscriptions.list` 불러오기 화면 구현 완료
  (`src/components/youtube-connect-modal.tsx`, `src/services/youtube.ts`, expo-auth-session)
- 현재 흐름: implicit(Token). 폰 로그인 붙일 때 Authorization Code + PKCE 로 이전 예정
- **사용자 할 일:** 구글 클라이언트 ID 발급 → **[docs/GOOGLE_SETUP.md](docs/GOOGLE_SETUP.md)** 참고
- 웹(컴퓨터) 먼저 연결 → 폰 로그인은 Android/iOS 클라이언트 + 개발 빌드 필요(다음 단계)

### ⬜ Phase 3 — AI 자동 분류 고도화
- `src/services/classify.ts` 를 Claude API 호출로 교체
- 채널 설명을 분석해 내가 만든 카테고리에 정확히 배정
- **필요한 것:** 백엔드 + Anthropic API 키 (호출당 소액 과금)

### ⬜ Phase 4 — 새 영상 알림
- 백엔드가 주기적으로 구독 채널의 신규 영상 확인 (YouTube API 또는 RSS)
- Expo Push Notifications 로 기기에 푸시
- **필요한 것:** 백엔드 스케줄러, 푸시 토큰 저장

### ⬜ Phase 5 — 노션 요약
- 영상 자막/설명을 Claude로 핵심 요약 → Notion API로 페이지 저장
- **필요한 것:** Notion 통합(Integration) 토큰, 대상 데이터베이스

### ⬜ Phase 6 — 공유 (카카오톡 / SNS)
- 웹/모바일 공유 시트, 카카오 SDK 연동
- **필요한 것:** Kakao Developers 앱 키

### ⬜ Phase 7 — 배포
- 폰에서 미리 체험(스토어 불필요): **[docs/RUN_ON_PHONE.md](docs/RUN_ON_PHONE.md)** (Expo Go)
- 안드로이드: Google Play ($25 1회) — **[docs/PLAY_STORE.md](docs/PLAY_STORE.md)** (빌드~심사~스토어 등록정보)
- 웹: Vercel/Netlify 등 (비용·심사 없음)
- iOS: App Store (Apple Developer $99/년), EAS Build로 빌드
- `eas.json` 준비 완료 (production=.aab). 개인정보처리방침: **[PRIVACY_POLICY.md](PRIVACY_POLICY.md)**

---

## 미리 알아둘 현실 체크
- **Google OAuth 심사:** `youtube.readonly`는 민감 권한. 불특정 다수 공개 배포 시 구글 검증 필요(수 주, 개인정보처리방침 등). **나 혼자/테스트 100명까지는 즉시 사용 가능.**
- **비용:** 웹은 무료. 앱스토어 정식 배포만 위 비용 발생. AI 요약/분류는 사용량 기반 소액 과금.
- **YouTube 카테고리 한계:** YouTube가 채널을 "영어학습/인문" 식으로 분류해 주지 않는다 → 그래서 우리가 규칙/AI로 분류한다.

---

## 현재 코드 구조 (Phase 1)
```
src/
  app/
    _layout.tsx        # 탭 네비게이션
    index.tsx          # [구독] 카테고리별 채널 목록 + 이동
    explore.tsx        # [설정] 분류함 관리 + 데이터 + 로드맵
  components/          # Avatar, ChannelCard, MoveSheet, CategoryFormModal, PrimaryButton ...
  store/store.ts       # zustand 전역 상태 + 기기 저장
  services/classify.ts # 자동 분류 (현재 규칙 기반 → Phase 3에서 AI로 교체)
  data/mockChannels.ts # 데모 구독 목록
  constants/categories.ts # 기본 분류함 7종 + 색상/이모지
  types.ts             # Category, Channel 모델
```

## 실행 방법
```bash
npm run web       # 웹 (브라우저)
npm run android   # 안드로이드 (에뮬레이터/기기)
npm run ios       # iOS (Mac 필요) — 또는 Expo Go 앱으로 QR 스캔
```
