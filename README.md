# 마이 튜브 (Favorit YouTube)

내 YouTube 구독 채널을 **내가 만든 카테고리로 자동 분류**하고 자유롭게 옮기는 앱.
이후 새 영상 알림 · 노션 요약 · 카카오톡/SNS 공유까지. **iOS · 안드로이드 · 웹** 공용 (Expo).

전체 기능 계획과 단계별 로드맵은 **[PROJECT_PLAN.md](PROJECT_PLAN.md)** 를 보세요.

## 현재 상태 — Phase 2 (유튜브 연동) 진행 중
- 분류함(카테고리) 직접 생성 · 수정 · 삭제
- 구독 채널 자동 분류 + 분류함 간 이동
- 도움말 · 개인정보처리방침 화면
- 실제 YouTube 연결(OAuth) 화면 — 구글 클라이언트 ID 입력 후 내 구독 불러오기

## 설정·배포 가이드 (따라 하기)
- **[유튜브 연결(구글 설정)](docs/GOOGLE_SETUP.md)** — 구글 클라이언트 ID 발급 후 앱에 연결
- **[폰에서 바로 실행 (Expo Go)](docs/RUN_ON_PHONE.md)** — 스토어 등록 없이 오늘 휴대폰에서 체험
- **[구글 플레이 등록](docs/PLAY_STORE.md)** — .aab 빌드부터 심사 제출 + 스토어 등록정보
- **[개인정보처리방침](PRIVACY_POLICY.md)** — 구글 동의화면·플레이 제출에 필요

## 실행
```bash
npm install        # 최초 1회
npm run web        # 웹 (브라우저 http://localhost:8081)
npm run android    # 안드로이드 (에뮬레이터/기기, 또는 Expo Go 앱)
npm run ios        # iOS (Mac 필요, 또는 Expo Go 앱으로 QR 스캔)
```

## 폴더 구조
```
src/
  app/        화면 (index=구독, explore=설정) + 탭 레이아웃
  components/ Avatar, ChannelCard, MoveSheet, CategoryFormModal, PrimaryButton ...
  store/      zustand 전역 상태 + 기기 저장
  services/   classify.ts (자동 분류)
  data/       mockChannels.ts (데모 구독 목록)
  constants/  categories.ts (기본 분류함 · 색상 · 이모지), theme.ts
  types.ts    Category · Channel 데이터 모델
```
