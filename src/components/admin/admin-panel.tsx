import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiSettings } from '@/components/admin/admin-ai';
import { makePinHash } from '@/components/admin/admin-login-modal';
import {
  Chips,
  Divider,
  LINK,
  LinkItem,
  OutlineButton,
  PageHeader,
  RadioGroup,
  SectionTitle,
  SettingRow,
  ToggleItem,
} from '@/components/admin/admin-ui';
import { useAuth } from '@/components/auth-provider';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/store';
import { ConnectedAppId } from '@/types';

type PageId = 'account' | 'time' | 'notify' | 'playback' | 'offline' | 'privacy' | 'apps' | 'advanced';

const PAGES: { id: PageId; label: string }[] = [
  { id: 'account', label: '계정' },
  { id: 'time', label: '시간 관리' },
  { id: 'notify', label: '알림' },
  { id: 'playback', label: '재생 및 실적' },
  { id: 'offline', label: '오프라인 저장 동영상' },
  { id: 'privacy', label: '공개 범위 설정' },
  { id: 'apps', label: '연결된 앱' },
  { id: 'advanced', label: '고급 설정' },
];

/** 관리자 페이지 (유튜브 설정 화면처럼 왼쪽 메뉴 + 오른쪽 내용). */
export function AdminPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const narrow = width < 900;
  const [page, setPage] = useState<PageId>('account');

  const lock = () => {
    useStore.getState().setAdminUnlockedUntil(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* 상단 바 */}
        <View style={[styles.topBar, { borderBottomColor: theme.backgroundSelected }]}>
          <Pressable onPress={onClose} hitSlop={8} aria-label="관리자 페이지 닫기">
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.topTitle, { color: theme.text }]}>🛡️ 관리자 페이지</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={lock} style={[styles.lockBtn, { borderColor: theme.backgroundSelected }]}>
            <MaterialCommunityIcons name="lock-outline" size={16} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>관리자 로그아웃</Text>
          </Pressable>
        </View>

        <View style={[styles.body, narrow && { flexDirection: 'column' }]}>
          {/* 왼쪽 메뉴 (좁은 화면은 위쪽 가로 줄) */}
          <ScrollView
            horizontal={narrow}
            style={narrow ? styles.navNarrow : styles.nav}
            contentContainerStyle={narrow ? styles.navNarrowContent : styles.navContent}
            showsHorizontalScrollIndicator={false}>
            {!narrow && <Text style={[styles.navTitle, { color: theme.textSecondary }]}>설정</Text>}
            {PAGES.map((p) => {
              const on = p.id === page;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPage(p.id)}
                  style={[styles.navItem, narrow && styles.navItemNarrow, on && { backgroundColor: theme.backgroundSelected }]}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: on ? '700' : '400' }}>{p.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, narrow && { padding: 16 }]}>
            <View style={styles.contentInner}>
              {page === 'account' && <AccountPage onLock={lock} />}
              {page === 'time' && <TimePage />}
              {page === 'notify' && <NotifyPage />}
              {page === 'playback' && <PlaybackPage />}
              {page === 'offline' && <OfflinePage />}
              {page === 'privacy' && <PrivacyPage />}
              {page === 'apps' && <AppsPage />}
              {page === 'advanced' && <AdvancedPage />}
              <View style={{ height: 80 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const useAdmin = () => {
  const settings = useStore((s) => s.adminSettings);
  const set = useStore((s) => s.setAdminSettings);
  return { settings, set };
};

// ---------------------------------------------------------------- 1. 계정
function AccountPage({ onLock }: { onLock: () => void }) {
  const theme = useTheme();
  const { configured, session, profile } = useAuth();
  const channels = useStore((s) => s.channels);
  const categories = useStore((s) => s.categories);
  const youtubeConnected = useStore((s) => s.youtubeConnected);
  const [pin, setPin] = useState('');
  const [pinNote, setPinNote] = useState('');
  const email = session?.user.email ?? profile?.email ?? null;
  const name = profile?.full_name || profile?.display_name || email || '이 기기 관리자';

  const changePin = async () => {
    if (pin.length < 6) {
      setPinNote('6자 이상으로 정해 주세요.');
      return;
    }
    useStore.getState().setAdminPinHash(await makePinHash(pin));
    setPin('');
    setPinNote('관리자 비밀번호를 바꿨어요.');
  };

  return (
    <>
      <PageHeader
        crumb="계정"
        title="마이 튜브에서 나를 표현하고 마이 튜브를 보는 방식을 선택하세요"
        desc={email ? `${email}(으)로 로그인` : configured ? '로그인 정보 없음' : '서버 연결 전 — 이 기기 관리자로 들어왔어요'}
        art="🧑‍💻"
      />

      <SectionTitle title="내 YouTube 채널" desc="마이 튜브가 정리하는 내 유튜브 구독 정보예요." />
      <SettingRow label="내 채널">
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: '#ff9fd8' }]}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{name}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              {youtubeConnected ? 'YouTube 연결됨' : 'YouTube 연결 안 됨'} · 구독 채널 {channels.length}개 · 분류함{' '}
              {categories.length}개
            </Text>
          </View>
        </View>
        <LinkItem label="채널 상태 및 기능" url="https://www.youtube.com/features" />
        <LinkItem label="채널 추가 또는 관리" url="https://www.youtube.com/account" />
        <LinkItem label="YouTube 구독 관리 열기" url="https://www.youtube.com/feed/channels" />
      </SettingRow>

      <Divider />
      <SectionTitle title="내 계정" desc="마이 튜브 계정과 관리자 권한을 관리해요." />
      <SettingRow label="Google 계정">
        <LinkItem
          label="Google 계정 설정 보기 또는 변경"
          url="https://myaccount.google.com/"
          desc="Google 계정 페이지로 이동합니다."
        />
      </SettingRow>
      <SettingRow label="회원 등급">
        <Text style={{ color: theme.text, fontSize: 14 }}>
          <Text style={{ fontWeight: '700' }}>관리자</Text>
          {configured
            ? ' · 다른 회원은 모두 일반 회원이에요. 등급은 Supabase SQL Editor 에서만 바꿀 수 있어요 (supabase/make-admin.sql).'
            : ' · 서버(Supabase) 연결 전이라 이 기기 주인이 관리자예요.'}
        </Text>
      </SettingRow>
      <SettingRow label="관리자 비밀번호">
        <View style={styles.inline}>
          <TextInput
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            placeholder="새 관리자 비밀번호 (6자 이상)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          <OutlineButton label="바꾸기" onPress={changePin} />
        </View>
        {pinNote ? <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{pinNote}</Text> : null}
        <OutlineButton label="관리자 로그아웃" danger onPress={onLock} />
      </SettingRow>
    </>
  );
}

// ---------------------------------------------------------------- 2. 시간 관리
const MINUTES = [15, 30, 60, 90, 120, 180].map((m) => ({ value: m, label: m < 60 ? `${m}분` : `${m / 60}시간` }));

function TimePage() {
  const theme = useTheme();
  const { settings, set } = useAdmin();
  const usage = useStore((s) => s.usage);
  const today = new Date().toLocaleDateString('sv-SE');
  const appMin = usage.date === today ? Math.floor(usage.appSec / 60) : 0;
  const shortsMin = usage.date === today ? Math.floor(usage.shortsSec / 60) : 0;
  return (
    <>
      <PageHeader crumb="시간 관리" title="마이 튜브 사용 시간 관리" art="⏳" />
      <SettingRow label="오늘 사용">
        <Text style={{ color: theme.text, fontSize: 14 }}>
          앱 {appMin}분 · Shorts {shortsMin}분
        </Text>
      </SettingRow>
      <SettingRow label="일일 한도">
        <ToggleItem
          value={settings.shortsLimitOn}
          onChange={(v) => set({ shortsLimitOn: v })}
          title="Shorts 피드"
          desc="매일 Shorts에서 스크롤할 수 있는 시간을 설정하세요. 다 쓰면 그날은 Shorts 줄이 쉬어요."
        />
        <Chips
          value={settings.shortsLimitMin}
          onChange={(v) => set({ shortsLimitMin: v })}
          options={MINUTES}
          disabled={!settings.shortsLimitOn}
        />
        <ToggleItem
          value={settings.dailyLimitOn}
          onChange={(v) => set({ dailyLimitOn: v })}
          title="앱 전체"
          desc="하루에 마이 튜브를 볼 시간을 정하면, 넘었을 때 알려 드려요."
        />
        <Chips
          value={settings.dailyLimitMin}
          onChange={(v) => set({ dailyLimitMin: v })}
          options={MINUTES}
          disabled={!settings.dailyLimitOn}
        />
      </SettingRow>
    </>
  );
}

// ---------------------------------------------------------------- 3. 알림
function NotifyPage() {
  const { settings, set } = useAdmin();
  const [note, setNote] = useState('');
  const toggleDesktop = async (v: boolean) => {
    if (v && Platform.OS === 'web' && typeof Notification !== 'undefined') {
      const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (perm !== 'granted') {
        setNote('브라우저에서 알림이 막혀 있어요. 주소창 왼쪽 자물쇠 → 알림 → 허용으로 바꿔 주세요.');
        return;
      }
      new Notification('마이 튜브', { body: '이 브라우저에서 알림을 받아요 🔔' });
    }
    setNote('');
    set({ desktopNotify: v });
  };
  return (
    <>
      <PageHeader
        crumb="알림"
        title="알림 받을 시간과 방법을 선택하세요"
        desc="받을 푸시 알림을 선택하세요."
        art="📬"
      />
      <SectionTitle title="일반" desc="모바일 및 데스크톱 알림 관리" />
      <SettingRow label="데스크톱 알림 표시">
        <ToggleItem
          value={settings.desktopNotify}
          onChange={toggleDesktop}
          title="이 브라우저에서 알림 받기"
          desc="마이 튜브를 보고 있지 않아도 내 컴퓨터에서 알림 수신 (페이지가 열려 있어야 해요)"
        />
        {note ? <Text style={{ color: '#d93025', fontSize: 13 }}>{note}</Text> : null}
      </SettingRow>
      <SettingRow label="내 환경설정">
        <ToggleItem
          value={settings.notifyNewVideos}
          onChange={(v) => set({ notifyNewVideos: v })}
          title="구독"
          desc="구독 중인 채널의 새 영상 알림 수신"
        />
        <ToggleItem
          value={settings.notifyWatchTime}
          onChange={(v) => set({ notifyWatchTime: v })}
          title="볼 시간 알림"
          desc="채널마다 정해 둔 '볼 시간'이 되면 알림 수신"
        />
        <ToggleItem
          value={settings.notifyTimeLimit}
          onChange={(v) => set({ notifyTimeLimit: v })}
          title="사용 시간 한도"
          desc="시간 관리에서 정한 하루 한도에 닿으면 알림 수신"
        />
        <ToggleItem
          value={settings.notifyNews}
          onChange={(v) => set({ notifyNews: v })}
          title="마이 튜브 소식 및 혜택"
          desc="새 기능과 업데이트 소식 알림 수신"
        />
      </SettingRow>
    </>
  );
}

// ---------------------------------------------------------------- 4. 재생 및 실적
function PlaybackPage() {
  const { settings, set } = useAdmin();
  return (
    <>
      <PageHeader crumb="재생 및 실적" title="동영상 시청 환경을 관리하세요" art="🕶️" />
      <SectionTitle title="언어" desc="언어 설정이 이 앱에 적용됩니다" />
      <SettingRow label="기본 언어">
        <RadioGroup
          value={settings.language}
          onChange={(v) => set({ language: v })}
          options={[
            { value: 'ko', label: '한국어' },
            { value: 'en', label: 'English (준비 중)', disabled: true },
          ]}
        />
      </SettingRow>
      <Divider />
      <SectionTitle title="재생" desc="재생 설정이 이 브라우저에만 적용됩니다." />
      <SettingRow label="영상 열기">
        <ToggleItem
          value={settings.openInNewTab}
          onChange={(v) => set({ openInNewTab: v })}
          title="새 탭에서 열기"
          desc="끄면 마이 튜브 창에서 바로 유튜브로 넘어가요"
        />
      </SettingRow>
      <SettingRow label="Shorts">
        <ToggleItem
          value={settings.shortsInPlayer}
          onChange={(v) => set({ shortsInPlayer: v })}
          title="Shorts 를 일반 플레이어로 열기"
          desc="세로 Shorts 화면 대신 일반 영상 화면(재생 막대·속도 조절)으로 열어요"
        />
      </SettingRow>
    </>
  );
}

// ---------------------------------------------------------------- 5. 오프라인 저장 동영상
function OfflinePage() {
  const theme = useTheme();
  const { settings, set } = useAdmin();
  const recentVideos = useStore((s) => s.recentVideos);
  const history = useStore((s) => s.watchHistory);
  const [done, setDone] = useState('');
  const cached = Object.values(recentVideos).reduce((n, v) => n + v.length, 0);
  return (
    <>
      <PageHeader
        crumb="오프라인 저장 동영상"
        title="오프라인 저장 동영상 설정 관리"
        desc="유튜브 영상 파일은 유튜브 약관상 앱에 저장할 수 없어서, 대신 이 기기에 저장되는 영상 정보(목록·썸네일)를 관리해요."
      />
      <SettingRow label="썸네일 품질">
        <RadioGroup
          value={settings.thumbQuality}
          onChange={(v) => set({ thumbQuality: v })}
          options={[
            { value: 'high', label: '높음 (480×360)' },
            { value: 'medium', label: '표준 (320×180) · 데이터 절약' },
            { value: 'low', label: '낮음 (120×90) · 데이터 최소' },
          ]}
        />
      </SettingRow>
      <Divider />
      <View style={styles.dangerRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.text, fontWeight: '700' }}>오프라인 저장 콘텐츠 모두 삭제</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            받아 둔 최신 영상 목록 {cached}개와 시청 기록 {history.length}개를 지워 이 기기의 저장 공간을 확보해요.
            분류함·채널은 그대로예요.
          </Text>
          {done ? <Text style={{ color: LINK, fontSize: 13 }}>{done}</Text> : null}
        </View>
        <OutlineButton
          label="오프라인 저장 콘텐츠 모두 삭제"
          onPress={() => {
            useStore.setState({ recentVideos: {}, lastCheckedAt: null });
            useStore.getState().clearHistory();
            setDone('지웠어요. 다음에 "새 영상 확인"을 누르면 다시 받아요.');
          }}
        />
      </View>
    </>
  );
}

// ---------------------------------------------------------------- 6. 공개 범위 설정
function PrivacyPage() {
  const { settings, set } = useAdmin();
  const { configured } = useAuth();
  return (
    <>
      <PageHeader
        crumb="공개 범위 설정"
        title="마이 튜브에 남기고 공유하는 정보 관리하기"
        desc="내 기록과 구독 정보를 어디까지 남기고 공유할지 선택하세요."
        art="🛡️"
      />
      <SettingRow label="기록">
        <ToggleItem
          value={settings.pauseHistory}
          onChange={(v) => set({ pauseHistory: v })}
          title="시청 기록 일시중지"
          desc="켜 두면 마이 튜브에서 연 영상이 '기록'에 남지 않아요."
        />
      </SettingRow>
      <SettingRow label="공유">
        <ToggleItem
          value={settings.shareIncludesChannel}
          onChange={(v) => set({ shareIncludesChannel: v })}
          title="공유할 때 채널 이름 포함"
          desc="카카오톡·SNS 로 영상을 공유할 때 채널 이름을 함께 보내요."
        />
      </SettingRow>
      <SettingRow label="클라우드">
        <ToggleItem
          value={settings.cloudSyncOn}
          onChange={(v) => set({ cloudSyncOn: v })}
          title="계정에 자동 동기화"
          desc={
            configured
              ? '끄면 분류함·채널 변경이 서버에 올라가지 않고 이 기기에만 남아요.'
              : '서버(Supabase) 연결 후에 적용돼요.'
          }
        />
      </SettingRow>
    </>
  );
}

// ---------------------------------------------------------------- 7. 연결된 앱
const APPS: {
  id: ConnectedAppId;
  name: string;
  icon: string;
  color: string;
  desc: string;
  fields: { key: string; label: string; placeholder: string; secret?: boolean }[];
  guide: string;
  test?: (v: Record<string, string>) => string;
}[] = [
  {
    id: 'notion',
    name: 'Notion',
    icon: 'notebook-outline',
    color: '#000000',
    desc: '영상 요약을 내 노션 데이터베이스에 저장해요.',
    fields: [
      { key: 'token', label: '통합(Integration) 토큰', placeholder: 'ntn_… 또는 secret_…', secret: true },
      { key: 'databaseId', label: '데이터베이스 ID', placeholder: '32자리 ID (노션 주소에 있음)' },
    ],
    guide:
      'notion.so/my-integrations 에서 통합을 만들고 토큰을 복사 → 저장할 데이터베이스 ⋯ → 연결 → 그 통합 추가. 노션은 브라우저에서 직접 부를 수 없어, 실제 저장은 서버 기능을 붙일 때 이 값을 써요.',
  },
  {
    id: 'kakao',
    name: '카카오톡',
    icon: 'chat',
    color: '#FEE500',
    desc: '마음에 드는 영상을 카카오톡 친구·단톡방에 공유해요.',
    fields: [{ key: 'jsKey', label: 'JavaScript 키', placeholder: 'developers.kakao.com → 내 애플리케이션 → 앱 키' }],
    guide: 'developers.kakao.com 에서 앱을 만들고 [플랫폼 → Web] 에 이 사이트 주소를 등록한 뒤 JavaScript 키를 넣어요.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    color: '#E1306C',
    desc: '인스타그램 프로필·스토리에 공유할 링크를 준비해요.',
    fields: [{ key: 'handle', label: '내 계정', placeholder: '@아이디' }],
    guide: '인스타그램은 웹에서 바로 글을 올리는 기능이 없어, 공유하면 링크가 복사되고 인스타그램이 열려요.',
    test: (v) => `https://www.instagram.com/${(v.handle ?? '').replace(/^@/, '')}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    desc: '영상을 페이스북 타임라인에 공유해요.',
    fields: [{ key: 'appId', label: '앱 ID (선택)', placeholder: '없어도 공유는 돼요' }],
    guide: '로그인된 페이스북 창에서 공유 화면이 열려요. 앱 ID 는 공유 통계를 볼 때만 필요해요.',
    test: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://mitube-life.web.app')}`,
  },
  {
    id: 'x',
    name: 'X (트위터)',
    icon: 'alpha-x-box',
    color: '#000000',
    desc: '영상 링크를 X 에 게시해요.',
    fields: [{ key: 'handle', label: '내 계정 (선택)', placeholder: '@아이디' }],
    guide: '게시 화면이 열리면 내용을 확인하고 [게시]를 누르면 돼요.',
    test: (v) =>
      `https://x.com/intent/post?text=${encodeURIComponent('마이 튜브로 정리한 내 유튜브 🎬')}&url=${encodeURIComponent('https://mitube-life.web.app')}${v.handle ? `&via=${encodeURIComponent(v.handle.replace(/^@/, ''))}` : ''}`,
  },
];

function AppsPage() {
  const theme = useTheme();
  const { settings, set } = useAdmin();
  const [open, setOpen] = useState<ConnectedAppId | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const save = (id: ConnectedAppId, connected: boolean, values: Record<string, string>) =>
    set({ apps: { ...settings.apps, [id]: { connected, values } } });

  return (
    <>
      <PageHeader
        crumb="연결된 앱"
        title="경험을 넓혀 보세요"
        desc="마이 튜브를 다른 앱과 연결하여 보다 간편하게 정리하고 공유하세요."
        art="🔗"
      />
      {APPS.map((app) => {
        const state = settings.apps[app.id];
        const editing = open === app.id;
        const required = app.fields.filter((f) => !/선택/.test(f.label));
        const canSave = required.every((f) => (draft[f.key] ?? '').trim());
        return (
          <View key={app.id} style={[styles.appRow, { borderBottomColor: theme.backgroundSelected }]}>
            <View style={styles.appHead}>
              <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                <MaterialCommunityIcons
                  name={app.icon as never}
                  size={26}
                  color={app.id === 'kakao' ? '#3C1E1E' : '#ffffff'}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                  {app.name} {state.connected ? '· ✅ 연결됨' : ''}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{app.desc}</Text>
              </View>
              {state.connected ? (
                <OutlineButton label="연결 해제" danger onPress={() => save(app.id, false, {})} />
              ) : (
                <OutlineButton
                  label="연결"
                  onPress={() => {
                    setOpen(editing ? null : app.id);
                    setDraft(state.values);
                  }}
                />
              )}
            </View>
            {state.connected && app.test && (
              <View style={{ paddingLeft: 64 }}>
                <LinkItem label="공유 시험해 보기" url={app.test(state.values)} />
              </View>
            )}
            {editing && !state.connected && (
              <View style={[styles.appForm, { backgroundColor: theme.backgroundElement }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>{app.guide}</Text>
                {app.fields.map((f) => (
                  <View key={f.key} style={{ gap: 4 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{f.label}</Text>
                    <TextInput
                      value={draft[f.key] ?? ''}
                      onChangeText={(t) => setDraft((d) => ({ ...d, [f.key]: t }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={f.secret}
                      autoCapitalize="none"
                      style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}
                    />
                  </View>
                ))}
                <View style={styles.inline}>
                  <OutlineButton label="취소" onPress={() => setOpen(null)} />
                  <OutlineButton
                    label="연결하기"
                    primary
                    disabled={!canSave}
                    onPress={() => {
                      const values = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()]));
                      save(app.id, true, values);
                      setOpen(null);
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- 8. 고급 설정
function AdvancedPage() {
  const theme = useTheme();
  const { session } = useAuth();
  const [copied, setCopied] = useState('');
  const userId = session?.user.id ?? 'local-device';
  const copy = (label: string, text: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => setCopied(label));
    }
  };
  return (
    <>
      <PageHeader crumb="고급 설정" title="마이 튜브를 원하는 대로 설정하기" art="🤖" />
      <SettingRow label="사용자 ID">
        <View style={[styles.copyBox, { borderColor: theme.backgroundSelected }]}>
          <Text selectable style={{ color: theme.text, flex: 1, fontSize: 14 }} numberOfLines={1}>
            {userId}
          </Text>
          <Pressable onPress={() => copy('사용자 ID', userId)} style={[styles.copyBtn, { borderColor: theme.backgroundSelected }]}>
            <Text style={{ color: theme.text, fontSize: 13 }}>{copied === '사용자 ID' ? '복사됨' : '복사'}</Text>
          </Pressable>
        </View>
      </SettingRow>
      <Divider />
      <AiSettings />
      <Divider />
      <SettingRow label="문서">
        <LinkItem label="Ollama 모델 목록 (Qwen)" url="https://ollama.com/search?q=qwen" desc="다른 크기의 Qwen 모델 이름을 찾을 수 있어요." />
        <LinkItem label="Ollama 내려받기" url="https://ollama.com/download" desc="AI 모델을 돌리는 무료 프로그램이에요." />
      </SettingRow>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, height: 56, borderBottomWidth: 1 },
  topTitle: { fontSize: 18, fontWeight: '800' },
  lockBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  body: { flex: 1, flexDirection: 'row' },
  nav: { width: 240, flexGrow: 0 },
  navContent: { padding: 12, gap: 2 },
  navTitle: { fontSize: 18, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 14 },
  navItem: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  navNarrow: { flexGrow: 0, maxHeight: 52 },
  navNarrowContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  navItemNarrow: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  content: { paddingHorizontal: 40, paddingVertical: 32, alignItems: 'center' },
  contentInner: { width: '100%', maxWidth: 1000 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1b2c9e', fontSize: 20, fontWeight: '800' },
  inline: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  input: { borderWidth: 1, borderRadius: 10, height: 42, paddingHorizontal: 12, fontSize: 14, minWidth: 240 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingVertical: 16 },
  appRow: { paddingVertical: 18, borderBottomWidth: 1, gap: 10 },
  appHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  appIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  appForm: { marginLeft: 64, borderRadius: 12, padding: 14, gap: 10 },
  copyBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingLeft: 14, paddingRight: 4, height: 48, maxWidth: 420, gap: 8 },
  copyBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
});
