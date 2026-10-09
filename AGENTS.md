# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# 프로젝트: 마이 튜브 (Favorit YouTube)

내 YouTube 구독 채널을 사용자가 만든 카테고리로 자동 분류 + 이동, 이후 새 영상 알림 ·
노션 요약 · SNS 공유까지. iOS/안드로이드/웹 한 코드베이스 (Expo + expo-router).

- 전체 계획과 단계별 로드맵은 **PROJECT_PLAN.md** 참고.
- 현재 **Phase 1(핵심 분류)** 완료 상태. 데모 데이터로 동작하며 실제 YouTube 연결은 Phase 2.
- 상태/저장: `src/store/store.ts` (zustand + AsyncStorage). 자동 분류: `src/services/classify.ts`
  (현재 규칙 기반 → Phase 3에서 Claude API로 교체 예정, 시그니처 유지).
- 화면: `src/app/index.tsx`(구독), `src/app/explore.tsx`(설정). UI 텍스트는 한국어.
- 실행: `npm run web` / `npm run android` / `npm run ios`.

## 주의
- 프로젝트 위치: `C:\Users\scpar\Project\My_youtube` (2026-10-07 OneDrive 밖으로 이동 완료).
  OneDrive 경로에 두면 node_modules 때문에 극심하게 느려지고 파일 잠금 충돌이 남 — 다시 옮기지 말 것.
- 실행 진입점: 바탕화면 `마이 튜브` 아이콘 → `start-app.ps1` (한글 때문에 .bat 이 아닌 PS1 사용,
  UTF-8 BOM 필수. cmd 배치에 한글을 넣으면 명령으로 오인돼 깨짐).
- 사용자는 비개발자에 가까움. 선택지를 길게 나열하기보다 합리적 기본값으로 진행하고
  필요한 것(API 키 등)만 단계별로 안내할 것.
