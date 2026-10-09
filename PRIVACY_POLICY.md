# 개인정보처리방침 / Privacy Policy

**시행일 / Effective date: [YYYY-MM-DD]**

본 방침은 "마이 튜브(Favorit YouTube)" 앱(이하 "앱")이 여러분의 개인정보를 어떻게 다루는지 알기 쉽게 설명합니다. 어려운 용어는 최대한 풀어서 적었습니다.

---

## 1. 한마디 요약

- 이 앱에는 **서버가 없습니다.** 여러분이 만든 카테고리, 채널 분류 결과, 앱 설정은 **모두 여러분 휴대폰(또는 사용하는 기기)에만** 저장됩니다. 우리 회사나 다른 어떤 곳으로도 전송되지 않습니다.
- YouTube 계정을 연결하면, 앱은 **구독 채널 목록을 "읽기만"** 합니다. 영상을 올리거나, 구독을 바꾸거나, 계정 정보를 수정하는 일은 절대 하지 않습니다.
- 여러분의 정보를 **제3자에게 팔거나 넘기지 않습니다.**

---

## 2. 앱이 저장하는 정보와 저장 위치

앱은 다음 정보를 **오직 여러분의 기기 안에만** 저장합니다. (기술적으로는 기기 내부 저장소를 사용합니다.)

| 저장되는 것 | 예시 | 저장 위치 |
| --- | --- | --- |
| 내가 만든 카테고리 | "요리", "IT/개발", "운동" 등 | 내 기기 안 |
| 채널 분류 결과 | 어떤 채널을 어떤 카테고리에 넣었는지 | 내 기기 안 |
| 앱 설정 | 화면 모드, 정렬 방식 등 | 내 기기 안 |

이 정보들은 외부 서버로 보내지지 않기 때문에, 앱을 지우면 함께 사라집니다(아래 6번 참고). 그래서 기기를 바꾸면 이 정보는 자동으로 옮겨지지 않습니다.

---

## 3. YouTube(구글) 계정 연결로 처리하는 정보

앱의 자동 분류 기능을 쓰려면 YouTube 계정 연결이 필요합니다. 이때 처리되는 정보는 다음과 같습니다.

### 3-1. 어떤 정보를, 왜 가져오나요?

- **가져오는 것:** 여러분의 **구독 채널 목록**(채널 이름, 채널 아이콘, 채널 설명 등)
- **쓰는 이유:** 그 채널들을 여러분이 만든 카테고리로 분류해서 보여주기 위해서입니다.

### 3-2. 어떤 권한을 요청하나요? (읽기 전용)

앱은 구글 로그인 화면에서 아래 **읽기 전용 권한 하나만** 요청합니다.

- 권한(스코프): `https://www.googleapis.com/auth/youtube.readonly`
- 실제로 하는 일: 두 가지 조회뿐입니다.
  1. 구독 목록 조회(`subscriptions.list`): 채널 이름·아이콘·설명
  2. 각 구독 채널의 공개 업로드 목록 조회(`playlistItems.list`): 최근 영상 제목·썸네일·게시 시각 (새 영상 알림·최근 영상 표시용)

"읽기 전용(readonly)"이란 **보기만 하고 아무것도 바꾸지 않는다**는 뜻입니다. 앱은 여러분을 대신해 구독을 추가/삭제하거나, 댓글을 달거나, 영상을 올릴 수 없습니다. 그럴 권한 자체를 요청하지 않기 때문입니다.

### 3-3. 가져온 목록은 어디에 저장되나요?

불러온 구독 채널 목록과 최근 영상 목록도 **여러분 기기 안에서만**(웹은 브라우저 저장소) 저장·표시됩니다. 우리 서버가 없으므로 어디에도 업로드되지 않습니다.

### 3-4. 로그인은 어떻게 처리되나요?

- 로그인은 표준 방식인 **구글 OAuth 2.0**을 사용합니다. 여러분의 구글 아이디·비밀번호는 앱이 절대 보지 못하며, 구글 화면에서만 입력합니다.
- 앱은 구글이 발급한 **짧은 수명의 접속 토큰(access token, 약 1시간 유효)** 만 받아 구독 목록과 최근 영상을 불러오는 데 씁니다. 이 토큰은 만료될 때까지 기기(웹은 브라우저 저장소)에 보관되며, Google 외에는 어디로도 전송되지 않습니다.
- 여러분이 직접 입력한 **구글 클라이언트 ID**와 **YouTube API 키**(선택)도 같은 방식으로 기기에만 보관되어, 로그인 없이 최근 영상을 불러오는 데만 쓰입니다.

---

## 4. 제3자 제공 및 구글 API 정책 준수

- 앱은 위에서 설명한 정보를 **어떤 제3자에게도 전송·공유·판매하지 않습니다.**
- 앱의 YouTube/구글 데이터 사용은 **[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)** 를 따르며, 여기에는 **제한적 사용(Limited Use)** 요건이 포함됩니다. 즉, 구글에서 받은 데이터는 사용자에게 보이는 기능(구독 채널 분류)에만 쓰고, 광고 목적 등으로 쓰지 않습니다.
- 앱은 광고 추적, 위치 수집, 연락처 접근 등을 하지 않습니다.

---

## 5. 정보 보관 기간

- 기기에 저장된 정보(카테고리·분류·설정)는 여러분이 **직접 지우기 전까지** 기기에 남아 있습니다.
- YouTube 연결로 불러온 구독 목록은 앱 사용 중 화면에 보여주기 위해서만 쓰이며, 별도의 외부 보관은 없습니다. 연결을 해제하면 다시 불러오지 않습니다.

---

## 6. 연결 해제 · 데이터 삭제 방법

아래 세 가지는 각각 별개입니다. 필요에 따라 원하는 것만 하셔도 됩니다.

### 6-1. 앱 안에서 YouTube 연결 끊기

1. 앱에서 **YouTube 연결** 창(구독 목록을 불러올 때 쓰는 그 화면)을 엽니다.
2. 연결된 상태에서 화면 아래쪽의 **연결 해제** 를 누릅니다.
   → 이렇게 하면 앱이 더 이상 구독 목록을 불러오지 않습니다. (단, 구글 계정 쪽에 남아 있는 "앱에 준 권한"은 아래 6-2에서 따로 없애야 완전히 정리됩니다.)

### 6-2. 구글 계정 쪽에서 앱 권한 완전히 없애기 (권장)

앱 안에서 연결을 끊어도, 구글 계정에는 "이 앱에 준 권한"이 기록으로 남아 있을 수 있습니다. 이를 완전히 없애려면 아래를 따라 하세요. (2026년 기준 메뉴 명칭입니다. 컴퓨터·휴대폰 브라우저 모두 동일합니다.)

1. 웹 브라우저에서 주소창에 **[myaccount.google.com/connections](https://myaccount.google.com/connections)** 를 입력해 들어갑니다.
   (또는 [myaccount.google.com](https://myaccount.google.com) → 왼쪽 메뉴 **보안(Security)** → 아래로 스크롤 → **타사 앱 및 서비스(Third-party apps & services)** → **모든 연결 보기(See all connections)** 순서로 가도 됩니다.)
2. 로그인한 뒤, 목록에서 **마이 튜브(Favorit YouTube)** 을 누릅니다.
3. 이 앱은 구글 계정의 일부 데이터(구독 목록)에 접근하는 앱이므로 **Google 계정에 대한 액세스 권한(Access to your Google Account)** 항목으로 표시됩니다. 이 항목을 눌러 **세부정보 보기(See details)** 를 누릅니다.
4. **액세스 권한 삭제(Remove access)** 를 누릅니다.
5. 확인 창이 뜨면 **확인(Confirm)** 을 누릅니다.
   → 이제 구글 계정에서 이 앱에 준 권한이 사라집니다.

> 참고: 화면 구성은 시점에 따라 조금씩 바뀔 수 있습니다. 버튼 이름이 위와 다르면, **"삭제 / 액세스 권한 삭제 / Remove"** 처럼 "권한을 없앤다"는 뜻의 버튼을 누르고 **확인**하면 됩니다.

### 6-3. 기기에 저장된 모든 데이터 지우기 (앱 초기화)

카테고리·분류·설정을 포함해 앱이 기기에 저장한 모든 정보를 지우려면 아래 중 하나를 선택하세요.

**방법 0 — 앱 안에서 "전체 초기화" (휴대폰·웹 공통)**

설정 → 데이터 → **전체 초기화** 를 누르고, 4초 안에 한 번 더 누릅니다. 분류함·채널·알림과 유튜브 로그인 토큰·API 키·클라이언트 정보가 모두 지워집니다.

**웹(mitube-life.web.app)에서 쓰는 경우**

브라우저 설정에서 이 사이트의 **사이트 데이터(쿠키 및 사이트 데이터)** 를 삭제해도 모두 지워집니다. (`mitube-life.web.app`과 `mitube-life.firebaseapp.com`은 저장소가 따로라 각각 지워야 합니다.)

**방법 A — 앱을 삭제(가장 간단)**

- **안드로이드:** 홈 화면이나 앱 목록에서 **마이 튜브** 아이콘을 길게 누른 뒤 **제거(Uninstall)** 를 누르고, 확인 창에서 **확인** 을 누릅니다.
- **iOS(아이폰):** 홈 화면에서 **마이 튜브** 아이콘을 길게 누릅니다. 메뉴가 뜨면 **앱 삭제(Delete App)** 를 누릅니다. (홈 화면에서 길게 누른 경우, 먼저 **앱 제거(Remove App)** 를 누른 뒤 **앱 삭제(Delete App)** 가 나올 수 있습니다.) 마지막으로 **삭제(Delete)** 를 누릅니다.
  → 앱을 삭제하면 기기에 저장돼 있던 데이터도 함께 지워집니다.

**방법 B — 앱은 남기고 데이터만 지우기 (안드로이드)**

1. **설정** 앱을 엽니다.
2. **애플리케이션(앱)** 을 누릅니다.
3. 목록에서 **마이 튜브** 을 누릅니다.
4. **저장공간(Storage)** 을 누릅니다.
5. **저장공간 지우기 / 데이터 삭제(Clear storage / Clear data)** 를 누르고 확인합니다.
   → 앱은 설치된 채로 처음 상태로 돌아갑니다. (기기·제조사에 따라 "저장공간 지우기" 또는 "데이터 삭제"로 이름이 다를 수 있습니다.)

> 참고: 아이폰(iOS)에는 "데이터만 삭제" 버튼이 따로 없습니다. 데이터를 완전히 지우려면 위 **방법 A**처럼 앱을 삭제한 뒤 필요할 때 다시 설치하시면 됩니다.

---

## 7. 만 14세 미만 어린이

본 앱은 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 고의로 수집하지 않습니다. 만 14세 미만 자녀가 보호자 동의 없이 앱을 사용한 사실을 알게 되신 경우, 아래 문의 이메일로 알려 주시면 확인 후 필요한 조치를 하겠습니다. (앱은 서버가 없어 기기 데이터는 위 6-3의 방법으로 즉시 삭제하실 수 있습니다.)

---

## 8. 방침 변경

본 방침이 바뀌면 앱 또는 배포 페이지에 새 시행일과 함께 게시합니다. 중요한 변경은 알아보기 쉽게 안내하겠습니다.

---

## 9. 문의

개인정보 처리에 대한 문의는 아래로 연락 주세요.

- 이메일: **[YOUR_EMAIL]**

---
---

# Privacy Policy (English)

**Effective date: [YYYY-MM-DD]**

This policy explains, in plain language, how the "Favorit YouTube" app ("the App") handles your information.

## 1. In short

- The App has **no server.** The categories you create, your channel classifications, and your settings are stored **only on your device.** They are never sent to us or anyone else.
- When you connect YouTube, the App only **reads your list of subscribed channels.** It never uploads videos, changes your subscriptions, or edits your account.
- We do **not** sell or share your information with any third party.

## 2. What we store, and where

The following is stored **only on your device** (in the device's local storage):

- Categories you create (e.g. "Cooking", "Dev/IT")
- Channel classification results (which channel is in which category)
- App settings (display mode, sort order, etc.)

Because none of this is sent to a server, it is removed when you delete the App (see Section 6).

## 3. YouTube (Google) account connection

- **What we fetch:** your **list of subscribed channels** (channel name, icon, description).
- **Why:** to sort those channels into the categories you created.
- **Permission requested (read-only):** `https://www.googleapis.com/auth/youtube.readonly`, used only to call `subscriptions.list` (your subscribed channels) and `playlistItems.list` (each subscribed channel's public uploads: recent video titles, thumbnails and publish times, for new-video alerts). "Read-only" means the App can only view — it cannot add/remove subscriptions, comment, or upload.
- **Where it's stored:** the fetched lists are stored and shown **only on your device** (in the browser's storage on the web). There is no server upload.
- **Sign-in:** standard **Google OAuth 2.0.** The App never sees your Google password; you enter it only on Google's own screen. The App receives a short-lived access token (valid about 1 hour), kept on your device until it expires and sent only to Google to load your subscriptions and recent videos. A Google client ID and an optional YouTube API key that you enter yourself are also kept only on your device.

## 4. Third parties & Google API compliance

- We do **not** transfer, share, or sell the above information to any third party.
- The App's use of YouTube/Google data complies with the **[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)**, including its **Limited Use** requirements. Google-provided data is used only for the user-facing feature (sorting subscribed channels) and never for advertising.

## 5. Data retention

- On-device data (categories, classifications, settings) remains until **you** delete it.
- The subscription list fetched via YouTube is used only to display content while you use the App; it is not separately retained off-device. Disconnecting stops any further fetching.

## 6. How to disconnect and delete your data

**6-1. Disconnect YouTube inside the App**
1. Open the **YouTube connection** screen (the same screen used to import your subscriptions).
2. While connected, tap **Disconnect** near the bottom. The App will stop fetching your subscriptions. (To also clear the permission stored on Google's side, do 6-2.)

**6-2. Remove the App's permission from your Google Account (recommended)**
1. Go to **[myaccount.google.com/connections](https://myaccount.google.com/connections)** and sign in. (Or: [myaccount.google.com](https://myaccount.google.com) → **Security** → **Third-party apps & services** → **See all connections**.)
2. Click **Favorit YouTube**.
3. It appears under **Access to your Google Account** (it uses a data scope, not "Sign in with Google"). Click it, then click **See details**.
4. Click **Remove access**.
5. Click **Confirm**.

**6-3. Erase all on-device data (reset)**
- **In the App (phone and web):** Settings → Data → **전체 초기화 (Reset all)**, then tap it again within 4 seconds. This erases categories, channels, alerts, and the stored YouTube token, API key and client details.
- **Web (mitube-life.web.app):** clearing this site's data in your browser settings also erases everything (mitube-life.web.app and mitube-life.firebaseapp.com keep separate storage).
- **Delete the App:**
  - **Android:** long-press the **Favorit YouTube** icon → **Uninstall** → confirm.
  - **iOS:** long-press the icon → **Delete App** → **Delete**. (From the Home Screen you may first tap **Remove App**, then **Delete App**.)
- **Android, keep app but clear data:** **Settings → Apps → Favorit YouTube → Storage → Clear storage (Clear data).**
- Note: iOS has no separate "clear data only" button; delete and reinstall the App instead.

## 7. Children under 14

The App is not directed to children under 14 and does not knowingly collect their personal information. If you believe a child under 14 has used the App without guardian consent, please contact us; since there is no server, on-device data can be erased immediately using Section 6-3.

## 8. Changes to this policy

If this policy changes, we will post the updated version with a new effective date in the App or on its distribution page.

## 9. Contact

- Email: **[YOUR_EMAIL]**

---

**Sources (2026 procedure verification):**
- [Manage links between your Google Account & apps from other developers — Google Account Help](https://support.google.com/accounts/answer/13533235?hl=en)
- [Google Account connections page](https://myaccount.google.com/connections)
- [Free up storage on your Android device — Android Help](https://support.google.com/android/answer/7431795?hl=en)
- [Remove or delete apps from iPhone — Apple Support](https://support.apple.com/guide/iphone/remove-or-delete-apps-iph248b543ca/ios)
