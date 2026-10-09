import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryFormModal } from '@/components/category-form-modal';
import { CategoryTabs, TabItem } from '@/components/category-tabs';
import { ChannelCard } from '@/components/channel-card';
import { getSampleVideosForChannel } from '@/data/sampleVideos';
import { ChannelSettingsSheet } from '@/components/channel-settings-sheet';
import { NewVideoPill, PillItem } from '@/components/new-video-pill';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  hasNoLocalVideos,
  isRealChannelId,
  purgeSampleVideos,
  isTokenUsable,
  readAuthFromStore,
  shownSinceFor,
  useNewVideoCheck,
  useNewVideoCounts,
  ViewSince,
} from '@/hooks/use-new-videos';
import { useAlertScheduleSync, useInAppAlerts } from '@/hooks/use-alerts';
import { useTheme } from '@/hooks/use-theme';
import { syncNow } from '@/services/cloud-sync';
import { channelUrl } from '@/services/youtube';
import { canRequestYouTubeToken, loadGsi } from '@/services/google-gsi';
import { isValidYouTubeApiKey, useStore } from '@/store/store';
import { Channel, Video } from '@/types';
import { shortAlert } from '@/utils/alert-time';

/** 분류함이 없는(미분류) 채널을 모으는 탭의 키. */
const NONE = '__none__';
/** 화면이 아주 넓어도 이 폭을 넘지 않는다. */
const MAX_WIDTH = 1600;
/** 자동 새 영상 확인 간격. */
const AUTO_CHECK_MS = 30 * 60 * 1000;
const CARD_GAP = 12;
const NO_VIDEOS: Video[] = [];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const safeArea = useSafeAreaInsets();
  const compact = useWindowDimensions().width < 700;

  const categories = useStore((s) => s.categories);
  const channels = useStore((s) => s.channels);
  const hydrated = useStore((s) => s.hydrated);
  const accessToken = useStore((s) => s.accessToken);
  const tokenExpiresAt = useStore((s) => s.tokenExpiresAt);
  const youtubeApiKey = useStore((s) => s.youtubeApiKey);
  const baselineAt = useStore((s) => s.baselineAt);
  const seenAt = useStore((s) => s.seenAt);
  const recentVideos = useStore((s) => s.recentVideos);
  const channelAlerts = useStore((s) => s.channelAlerts);
  const importDemoChannels = useStore((s) => s.importDemoChannels);
  const addCategory = useStore((s) => s.addCategory);
  const setConnectRequested = useStore((s) => s.setConnectRequested);

  const [settingsTarget, setSettingsTarget] = useState<Channel | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewSince, setViewSince] = useState<ViewSince | null>(null);
  /** 분류함 추가 창: null 이면 닫힘, parentId 가 있으면 그 아래 하위 분류함 추가. */
  const [addMode, setAddMode] = useState<{ parentId: string | null } | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // 채널이 속한 '상위 탭' 키: 하위 분류함에 있으면 그 상위, 지워진 분류함을 가리키면 미분류.
  const tabKeyOf = useCallback(
    (ch: Channel) => {
      const cat = ch.categoryId ? categoryById.get(ch.categoryId) : undefined;
      if (!cat) return NONE;
      if (cat.parentId) return categoryById.has(cat.parentId) ? cat.parentId : NONE;
      return cat.id;
    },
    [categoryById],
  );

  // 채널을 탭별로 묶고, 분류함 순서대로 탭을 만든다. 미분류는 있을 때만 맨 끝에.
  const { tabs, byTab } = useMemo(() => {
    const byTab = new Map<string, Channel[]>();
    for (const ch of channels) {
      const key = tabKeyOf(ch);
      const list = byTab.get(key);
      if (list) list.push(ch);
      else byTab.set(key, [ch]);
    }
    const tabs: TabItem[] = categories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.order - b.order)
      // 숫자는 하위 분류함의 채널까지 합친 그 대분류의 채널 수.
      .map((c) => ({
        key: c.id,
        label: c.name,
        color: c.color,
        count: byTab.get(c.id)?.length ?? 0,
      }));
    if (byTab.has(NONE)) {
      tabs.push({
        key: NONE,
        label: '미분류',
        color: theme.textSecondary,
        count: byTab.get(NONE)?.length ?? 0,
      });
    }
    return { tabs, byTab };
  }, [categories, channels, tabKeyOf, theme.textSecondary]);

  // 고른 탭이 사라졌으면(분류함 삭제, 미분류가 0개가 됨 등) 채널이 있는 첫 탭으로 간다.
  const activeKey =
    selected && tabs.some((t) => t.key === selected)
      ? selected
      : ((tabs.find((t) => byTab.has(t.key)) ?? tabs[0])?.key ?? NONE);
  const activeTab = tabs.find((t) => t.key === activeKey);
  const uncategorized = byTab.get(NONE)?.length ?? 0;

  // 선택한 상위 탭의 하위 분류함. 하위 탭을 고르면 그 하위의 채널만, 안 고르면 상위 전체를 보여 준다.
  const subTabs: TabItem[] = categories
    .filter((c) => c.parentId === activeKey)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ key: c.id, label: c.name, color: c.color }));
  const activeSubKey =
    selectedSub && subTabs.some((t) => t.key === selectedSub) ? selectedSub : null;
  const activeSub = subTabs.find((t) => t.key === activeSubKey);
  const tabChannels = byTab.get(activeKey) ?? [];
  const activeChannels = activeSubKey
    ? tabChannels.filter((ch) => ch.categoryId === activeSubKey)
    : tabChannels;

  // 고른 탭이 사라져 다른 탭으로 넘어갔으면 그 탭을 '선택됨'으로 확정한다.
  // 안 그러면 사라졌던 미분류 탭이 다시 생길 때 보던 탭에서 갑자기 튕겨 나간다.
  useEffect(() => {
    if (selected !== activeKey) setSelected(activeKey);
  }, [selected, activeKey]);

  // ---------- 새 영상 알림 ----------
  const { byChannel: newByChannel, byTab: newByTab } = useNewVideoCounts(
    channels,
    tabKeyOf,
    viewSince,
  );
  const { state: checkState, progress, message: checkMessage, check } = useNewVideoCheck();

  // ---------- 볼 시간 알림 ----------
  useAlertScheduleSync(); // 휴대폰: OS 예약을 설정과 맞춘다
  const { due: dueAlerts, dismiss: dismissAlert } = useInAppAlerts(); // 웹: 화면이 열려 있을 때 알린다

  const hasChannels = channels.length > 0;
  // 구글 창이 팝업 차단에 걸리지 않도록 스크립트를 미리 불러 둔다 (웹). 예전에 들어간 가짜 샘플 영상도 정리.
  useEffect(() => {
    if (canRequestYouTubeToken()) loadGsi().catch(() => {});
    purgeSampleVideos();
  }, []);
  useEffect(() => {
    // 처음 열 때와 새로 로그인했을 때, 마지막 확인이 30분 넘게 지났으면 자동으로 확인한다.
    if (!hydrated || !hasChannels) return;
    // 읽을 수단이 없으면 자동으로는 확인하지 않는다 (구글 창은 사용자가 ⏰ 를 눌렀을 때만).
    if (!readAuthFromStore() && !hasNoLocalVideos()) return;
    const s = useStore.getState();
    // 다른 기기에서 확인한 시각이 동기화돼 와도, 이 기기에 영상 기록이 없으면 확인한다.
    if (s.lastCheckedAt && Date.now() - s.lastCheckedAt < AUTO_CHECK_MS && !hasNoLocalVideos()) return;
    check();
  }, [hydrated, hasChannels, accessToken, youtubeApiKey, check]);

  const pillItems: PillItem[] = tabs
    .filter((t) => (newByTab.get(t.key) ?? 0) > 0)
    .map((t) => ({
      key: t.key,
      label: t.label,
      color: t.color,
      count: newByTab.get(t.key) ?? 0,
    }));
  const activeNew = activeChannels.reduce((sum, ch) => sum + (newByChannel.get(ch.id) ?? 0), 0);
  // 로그인이 없거나 만료됐으면 ⏰ 표시줄에 '눌러서 연결'을 띄운다.
  const pillState =
    checkState === 'idle' && !isValidYouTubeApiKey(youtubeApiKey) && !isTokenUsable(accessToken, tokenExpiresAt) &&
    channels.some((c) => isRealChannelId(c.id))
      ? 'needs-login'
      : checkState;

  const onAlarm = () => {
    if (!readAuthFromStore() && !canRequestYouTubeToken()) {
      // 휴대폰 앱: 설정의 유튜브 연결 창을 연다.
      setConnectRequested(true);
      router.push('/explore');
      return;
    }
    // 웹: 필요하면 구글 창으로 YouTube 읽기 권한을 받고 바로 최신 영상을 가져온다.
    check({ interactive: true });
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const uid = useStore.getState().syncedUserId;
      if (uid) {
        try {
          // 이 기기에서 바뀐 내용을 먼저 올린 뒤 내려받는다 (안 그러면 올라가기 전 변경이 지워진다).
          await syncNow(uid);
        } catch {}
      }
      if (readAuthFromStore()) {
        await check();
      }
    } catch {}
    finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }, [check]);

  // 탭을 열면 그 탭의 새 영상을 '본 것'으로 기록한다. 단, 지금 보는 동안은 채널 배지를 그대로 둔다.
  const selectTab = (key: string) => {
    if (viewSince?.key === key) {
      setSelected(key);
      onRefresh();
      return;
    }
    const s = useStore.getState();
    setViewSince({
      key,
      since: Math.max(s.seenAt[key] ?? 0, s.baselineAt ?? 0),
    });
    setSelected(key);
    setSelectedSub(null);
    if (s.baselineAt != null) s.markSeen(key);
    onRefresh();
  };

  // 분류함 지우기: 그 분류함(대분류면 하위까지)의 채널은 모두 미분류로 간다.
  const deleteCategory = useStore((s) => s.deleteCategory);
  const confirmDelete = (id: string) => {
    const cat = categoryById.get(id);
    if (!cat) return;
    const subs = categories.filter((c) => c.parentId === id);
    const ids = new Set([id, ...subs.map((c) => c.id)]);
    const n = channels.filter((ch) => ch.categoryId && ids.has(ch.categoryId)).length;
    const msg =
      `'${cat.name}' 분류함을 지울까요?` +
      (subs.length > 0 ? `\n하위 분류함 ${subs.length}개도 함께 지워져요.` : '') +
      `\n들어 있던 채널 ${n}개는 미분류로 옮겨져요.`;
    const run = () => {
      deleteCategory(id);
      setSelectedSub(null);
      if (!cat.parentId) setSelected(null);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) run();
    } else {
      Alert.alert('분류함 삭제', msg, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: run },
      ]);
    }
  };

  const handleAdd = (name: string, emoji: string, color: string) => {
    const parentId = addMode?.parentId ?? null;
    const id = addCategory(name, emoji, color, parentId);
    setAddMode(null);
    if (parentId) {
      if (parentId !== activeKey) selectTab(parentId);
      setSelectedSub(id);
    } else {
      selectTab(id);
    }
  };

  // ---------- 레이아웃 ----------
  const pad = compact ? Spacing.three : 28;
  const topPad = Platform.OS === 'web' ? 80 : safeArea.top + Spacing.three;
  // 이 화면은 바깥이 스크롤되지 않으므로 탭바 높이를 두 번 빼면 아래에 빈 띠가 생긴다.
  const bottomPad = Platform.select({
    web: Spacing.four,
    // iOS: 탭마다 붙는 SafeAreaProvider 의 bottom 에 이미 탭바 높이가 들어 있다.
    ios: safeArea.bottom + Spacing.two,
    // Android: 탭 화면이 자동으로 탭바 위에서 끝난다.
    default: Spacing.two,
  });
  // 지금 보는 탭에서 NEW 를 가르는 기준 시각 (목록의 채널은 모두 이 탭 소속).
  const activeNewSince = shownSinceFor(activeKey, viewSince, seenAt, baselineAt);

  // 웹: 브라우저 탭 제목과 검색·공유용 설명. 정적 HTML은 저장소를 읽기 전(!hydrated) 상태로 만들어지므로 두 분기에 모두 넣는다.
  const head = (
    <Head>
      <title>마이 튜브</title>
      <meta
        name="description"
        content="내 유튜브 구독 채널을 분류함으로 정리하고, 새 영상을 정해 둔 시간에 알려 주는 마이 튜브"
      />
    </Head>
  );

  if (!hydrated) {
    return (
      <ThemedView style={styles.center}>
        {head}
        <ActivityIndicator color={theme.text} />
      </ThemedView>
    );
  }

  const summary =
    `${channels.length}개 채널 · 분류함 ${categories.length}개` +
    (uncategorized > 0 ? ` · 미분류 ${uncategorized}개` : '');

  return (
    <ThemedView style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      {head}
      <View style={[styles.frame, { paddingHorizontal: pad }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Pressable
              role="button"
              aria-label="홈 화면으로 이동"
              onPress={() => router.push('/')}
              style={({ pressed }) => [styles.homeIconButton, pressed && { opacity: 0.7 }]}>
              <MaterialCommunityIcons name="home-variant" size={compact ? 24 : 28} color={theme.text} />
            </Pressable>
            <View style={styles.titleBlock}>
              <ThemedText style={[styles.title, compact && styles.titleCompact]}>내 구독</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.summary}>
                {hasChannels ? summary : '구독 채널을 분류함으로 정리해 보세요'}
              </ThemedText>
            </View>
          </View>
          {hasChannels && (
            <NewVideoPill
              items={pillItems}
              state={pillState}
              progress={progress}
              checkedOnce={baselineAt != null}
              onAlarm={onAlarm}
              onSelect={selectTab}
            />
          )}
        </View>
        {checkMessage && (pillState === 'error' || pillState === 'needs-login') ? (
          <ThemedText type="small" style={styles.checkError}>
            ⚠️ {checkMessage}
          </ThemedText>
        ) : pillState === 'needs-login' && hasChannels ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.checkHint}>
            ⏰ 를 눌러 YouTube에 연결하면 채널별 최신 영상 썸네일이 나와요 (이 기기에서 한 번, 약 1시간 유지).
          </ThemedText>
        ) : null}

        {dueAlerts.map((d) => (
          <View
            key={d.channelId}
            style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
            <MaterialCommunityIcons name="bell-ring" size={18} color="#ff0033" />
            <ThemedText type="small" style={styles.bannerText}>
              <ThemedText type="smallBold">{d.title}</ThemedText> 볼 시간이에요!
            </ThemedText>
            <Pressable
              role="button"
              aria-label={`${d.title} 열기`}
              onPress={() => {
                const ch = channels.find((c) => c.id === d.channelId);
                if (ch) Linking.openURL(channelUrl(ch)).catch(() => {});
                dismissAlert(d.channelId);
              }}>
              <ThemedText type="smallBold" style={styles.bannerAction}>
                열기
              </ThemedText>
            </Pressable>
            <Pressable
              role="button"
              aria-label="알림 닫기"
              onPress={() => dismissAlert(d.channelId)}>
              <ThemedText type="small" themeColor="textSecondary">
                닫기
              </ThemedText>
            </Pressable>
          </View>
        ))}

        {!hasChannels ? (
          <EmptyState onImport={importDemoChannels} />
        ) : (
          <>
            <CategoryTabs
              tabs={tabs}
              activeKey={activeKey}
              onSelect={selectTab}
              onAdd={() => setAddMode({ parentId: null })}
              subTabs={subTabs}
              activeSubKey={activeSubKey}
              onSelectSub={setSelectedSub}
              onAddSub={activeKey === NONE ? undefined : () => setAddMode({ parentId: activeKey })}
            />

            <View style={styles.listHeader}>
              <ThemedText type="smallBold">
                {activeTab?.label}
                {activeSub ? ` › ${activeSub.label}` : subTabs.length > 0 ? ' (전체)' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                채널 {activeChannels.length}개
              </ThemedText>
              {activeNew > 0 && (
                <ThemedText type="small" style={styles.newText}>
                  · 새 영상 {activeNew}개
                </ThemedText>
              )}
              {baselineAt == null && (
                <ThemedText type="small" themeColor="textSecondary">
                  · ⏰ 를 누르면 채널마다 최신 영상이 함께 보여요
                </ThemedText>
              )}
              {activeKey !== NONE && (activeSub ?? activeTab) && (
                <Pressable
                  onPress={() => confirmDelete(activeSub ? activeSub.key : activeKey)}
                  hitSlop={8}
                  role="button"
                  aria-label={`${(activeSub ?? activeTab)?.label} 분류함 삭제`}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={15} color="#ef4444" />
                  <ThemedText type="small" style={{ color: '#ef4444' }}>
                    {activeSub ? '하위 분류함 삭제' : '분류함 삭제'}
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <View style={styles.listArea}>
              <FlatList
                // 탭을 바꾸면 새로 그려 스크롤을 맨 위로 되돌린다.
                key={`${activeKey}:${activeSubKey ?? 'all'}`}
                data={activeChannels}
                keyExtractor={(ch) => ch.id}
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.listContent}
                initialNumToRender={10}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#ff0033"
                    colors={['#ff0033']}
                  />
                }
                renderItem={({ item }) => {
                  const category = item.categoryId
                    ? (categoryById.get(item.categoryId) ?? null)
                    : null;
                  return (
                    <ChannelCard
                      channel={item}
                      category={category}
                      // '전체' 목록에서는 소분류에 든 채널에 소분류 이름표를 단다 (소분류 탭을 고르면 생략).
                      subLabel={!activeSubKey && category?.parentId ? category : undefined}
                      onSettings={setSettingsTarget}
                      alertLabel={
                        channelAlerts[item.id] ? shortAlert(channelAlerts[item.id]) : undefined
                      }
                      newCount={newByChannel.get(item.id) ?? 0}
                      // 실제 채널은 실제 영상만 (없으면 비움). 샘플은 데모 채널에만.
                      videos={
                        isRealChannelId(item.id)
                          ? (recentVideos[item.id] ?? []).filter((v) => !v.id.startsWith('sample-'))
                          : (recentVideos[item.id] ?? getSampleVideosForChannel(item.id, item.title))
                      }
                      newSince={activeNewSince}
                      compact={compact}
                    />
                  );
                }}
                ListEmptyComponent={
                  <PanelEmpty label={activeSub?.label ?? activeTab?.label ?? ''} />
                }
              />
            </View>
          </>
        )}
      </View>

      <ChannelSettingsSheet
        channel={settingsTarget}
        categories={categories}
        onClose={() => setSettingsTarget(null)}
      />
      <CategoryFormModal
        visible={addMode !== null}
        parentName={addMode?.parentId ? categoryById.get(addMode.parentId)?.name : undefined}
        onSubmit={handleAdd}
        onClose={() => setAddMode(null)}
      />
    </ThemedView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function PanelEmpty({ label }: { label: string }) {
  return (
    <View style={styles.panelEmpty}>
      <ThemedText type="smallBold">{label} 분류함이 비어 있어요</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        다른 탭에서 채널의 "설정 → 분류함 이동"으로 이곳에 옮겨 보세요.
      </ThemedText>
    </View>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <ThemedView type="backgroundElement" style={styles.empty}>
      <ThemedText style={styles.emptyEmoji}>📺</ThemedText>
      <ThemedText type="smallBold" style={styles.emptyTitle}>
        아직 불러온 채널이 없어요
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        설정 → YouTube 계정 연결에서 내 구독을 불러오거나,{'\n'}
        데모 채널로 먼저 체험해 보세요.
      </ThemedText>
      <PrimaryButton label="데모 채널 불러오기" onPress={onImport} style={styles.emptyButton} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  checkHint: { paddingHorizontal: 16, paddingBottom: 6 },
  checkError: { color: '#d93025', paddingHorizontal: 16, paddingBottom: 6, textAlign: 'right' },
  container: { flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  titleBlock: { gap: 2 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '600' },
  titleCompact: { fontSize: 24, lineHeight: 30 },
  summary: { fontSize: 12, lineHeight: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  listHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  newText: { color: '#ff0033', fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  bannerText: { flex: 1 },
  bannerAction: { color: '#ff0033' },
  listArea: { flex: 1 },
  listContent: { paddingBottom: Spacing.four },
  separator: { height: CARD_GAP },
  panelEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.one,
  },
  centerText: { textAlign: 'center', lineHeight: 20 },
  empty: {
    marginTop: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { marginTop: Spacing.two },
  emptyButton: { marginTop: Spacing.three, alignSelf: 'stretch' },
});
