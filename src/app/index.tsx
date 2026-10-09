import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LibraryKind, LibraryView, openVideo, SaveVideoMenu } from '@/components/library-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { readAuthFromStore } from '@/hooks/use-new-videos';
import { useTheme } from '@/hooks/use-theme';
import { shortsLimitReached } from '@/hooks/use-usage-tracker';
import { syncNow } from '@/services/cloud-sync';
import { timeAgo } from '@/utils/format';
import { channelUrl, fetchRecentVideos } from '@/services/youtube';
import { useStore } from '@/store/store';
import { Category, Channel, Video } from '@/types';

interface FeedVideoItem {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelId: string;
  channelTitle: string;
  channelAvatar?: string;
  views: string;
  timeAgo: string;
  categoryId: string | null;
  isShort?: boolean;
}

/** 데모용 고화질 최신 영상 목록 */
const SAMPLE_VIDEOS: FeedVideoItem[] = [
  {
    id: 'vid-news-1',
    title: '[오늘 이 뉴스] 주요 외교 안보 긴급 브리핑 & 국제 정세 심층 분석',
    thumbnail: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    duration: '14:30',
    channelId: 'ch-jiyoon',
    channelTitle: '김지윤의 지식Play',
    channelAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    views: '4.2만회',
    timeAgo: '10분 전',
    categoryId: 'cat-politics',
  },
  {
    id: 'vid-drum-1',
    title: '아쉽게도, 드럼 실력을 빠르게 키우는 방법은 정말 간단합니다',
    thumbnail: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&auto=format&fit=crop&q=80',
    duration: '9:42',
    channelId: 'ch-drum',
    channelTitle: 'Drum Beats Online',
    channelAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    views: '10만회',
    timeAgo: '4주 전',
    categoryId: 'cat-humanities',
  },
  {
    id: 'vid-travel-1',
    title: '1인 30만원 럭셔리 스파 찜질방은 과연 돈값을 할까? 솔직 후기',
    thumbnail: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    duration: '41:59',
    channelId: 'ch-panibottle',
    channelTitle: '빠니보틀 Pani Bottle',
    channelAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    views: '7.8만회',
    timeAgo: '36분 전',
    categoryId: 'cat-travel',
  },
  {
    id: 'vid-ai-1',
    title: 'Claude 3.7 & 차세대 AI 에이전트 실전 코딩과 개발 워크플로우 완벽 가이드',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    duration: '22:15',
    channelId: 'ch-karpathy',
    channelTitle: 'Andrej Karpathy',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    views: '19만회',
    timeAgo: '2시간 전',
    categoryId: 'cat-ai',
  },
  {
    id: 'vid-english-1',
    title: '미국 원어민들이 일상에서 매일 쓰는 핵심 회화 표현 BEST 10',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    duration: '16:04',
    channelId: 'ch-liveacademy',
    channelTitle: '라이브아카데미 Live Academy',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    views: '35만회',
    timeAgo: '3시간 전',
    categoryId: 'cat-english',
  },
  {
    id: 'vid-history-1',
    title: '로마 제국의 찬란한 번영 뒤에 가려졌던 충격적인 진실과 권력 암투',
    thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
    duration: '28:40',
    channelId: 'ch-history',
    channelTitle: '역사를 보다',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    views: '12만회',
    timeAgo: '5시간 전',
    categoryId: 'cat-history',
  },
];

/** 데모용 세로형 최신 Shorts 목록 */
const SAMPLE_SHORTS: FeedVideoItem[] = [
  {
    id: 'short-1',
    title: '초단 손가락 다 터져나간 QWER 신곡 드럼 수준',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    duration: '0:58',
    channelId: 'ch-qwer',
    channelTitle: 'QWER_DALBAM',
    views: '128만회',
    timeAgo: '방금 전',
    categoryId: 'cat-humanities',
    isShort: true,
  },
  {
    id: 'short-2',
    title: '소개팅에서 질문 3개로 상대 여성 거르는 남자 ㅋㅋㅋ',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    duration: '0:45',
    channelId: 'ch-humor',
    channelTitle: '스낵 유머',
    views: '84만회',
    timeAgo: '1시간 전',
    categoryId: 'cat-humanities',
    isShort: true,
  },
  {
    id: 'short-3',
    title: '남자가 30대부터 반드시 꾸며야 하는 현실적인 이유',
    thumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    duration: '0:52',
    channelId: 'ch-style',
    channelTitle: '맨즈 스타일 랩',
    views: '56만회',
    timeAgo: '3시간 전',
    categoryId: 'cat-humanities',
    isShort: true,
  },
  {
    id: 'short-4',
    title: '밴드부 민폐 드럼 3위 ㅋㅋㅋ 합주 현장',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80',
    duration: '0:39',
    channelId: 'ch-band',
    channelTitle: '유다빈밴드 라이브',
    views: '42만회',
    timeAgo: '5시간 전',
    categoryId: 'cat-humanities',
    isShort: true,
  },
  {
    id: 'short-5',
    title: '조국혁신당 이정주기자를 싫어하는 이유? 팩트 비하인드',
    thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=500&auto=format&fit=crop&q=80',
    duration: '0:59',
    channelId: 'ch-jiyoon',
    channelTitle: '시사 팩트체크',
    views: '93만회',
    timeAgo: '6시간 전',
    categoryId: 'cat-politics',
    isShort: true,
  },
];

const THUMB_FILE = { high: 'hqdefault', medium: 'mqdefault', low: 'default' } as const;
function thumbUrl(id: string, q: keyof typeof THUMB_FILE, fallback?: string) {
  return /^[\w-]{11}$/.test(id) ? `https://i.ytimg.com/vi/${id}/${THUMB_FILE[q]}.jpg` : (fallback ?? '');
}

export default function HomeScreenFeed() {
  const theme = useTheme();
  const router = useRouter();
  const safeArea = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isMobile = width < 768;

  const categories = useStore((s) => s.categories);
  const channels = useStore((s) => s.channels);
  const recentVideos = useStore((s) => s.recentVideos);

  // 상단 칩 대분류 선택 ('all' = 전체)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // 사이드바 카테고리 펼침 상태 (대분류 id -> boolean)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  // 쇼츠 모아보기 전용 필터 모드
  const [shortsOnly, setShortsOnlyRaw] = useState<boolean>(false);
  // 내 보관함 화면 (null = 피드). 홈·Shorts·분류를 고르면 피드로 돌아간다.
  const [library, setLibrary] = useState<LibraryKind | null>(null);

  // 모바일 전용 사이드바 드로어 열림 상태
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const setShortsOnly = (v: boolean) => {
    setShortsOnlyRaw(v);
    setLibrary(null);
  };

  // 관리자 설정 → 시간 관리
  const usage = useStore((s) => s.usage);
  const shortsLimitMin = useStore((s) => s.adminSettings.shortsLimitMin);
  const shortsLimitOn = useStore((s) => s.adminSettings.shortsLimitOn);
  const shortsBlocked = useMemo(() => shortsLimitReached(), [usage, shortsLimitMin, shortsLimitOn]);
  useEffect(() => {
    useStore.getState().setViewingShorts(shortsOnly && !library);
    return () => useStore.getState().setViewingShorts(false);
  }, [shortsOnly, library]);

  // 관리자 설정 → 오프라인 저장: 썸네일 품질
  const thumbQuality = useStore((s) => s.adminSettings.thumbQuality);

  // ⋮ 버튼으로 연 '저장' 메뉴 대상 영상
  const [saveTarget, setSaveTarget] = useState<FeedVideoItem | null>(null);

  const feedScrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. 로그인 상태이면 클라우드 최신 카테고리/채널 구성 동기화
      const uid = useStore.getState().syncedUserId;
      if (uid) {
        try {
          await syncNow(uid); // 먼저 올리고 받는다 (방금 바꾼 내용이 지워지지 않게)
        } catch {}
      }

      // 2. 유튜브 최신 영상 갱신 — 30분 안에 확인했으면 건너뛴다.
      //    (예전에는 탭을 누를 때마다 360개 채널을 다시 받아 하루 YouTube 사용량을 빠르게 소진했다)
      const auth = readAuthFromStore();
      const last = useStore.getState().lastCheckedAt;
      if (auth && (!last || Date.now() - last > 30 * 60 * 1000)) {
        const { channels, saveRecentVideos } = useStore.getState();
        const videos = await fetchRecentVideos(auth, channels.map((c) => c.id));
        saveRecentVideos(videos, Date.now());
      }
    } catch {}
    finally {
      setTimeout(() => {
        setRefreshTick((t) => t + 1);
        setRefreshing(false);
      }, 500);
    }
  }, []);

  const handleHomeClick = useCallback(() => {
    setSelectedCategory('all');
    setShortsOnly(false);
    setMobileDrawerOpen(false);
    triggerRefresh();
    feedScrollRef.current?.scrollTo?.({ y: 0, animated: true });
  }, [triggerRefresh]);

  const handleCategoryClick = useCallback((catId: string) => {
    setSelectedCategory(catId);
    setShortsOnly(false);
    setMobileDrawerOpen(false);
    triggerRefresh();
    feedScrollRef.current?.scrollTo?.({ y: 0, animated: true });
  }, [triggerRefresh]);

  const handleShortsClick = useCallback(() => {
    setShortsOnly(true);
    setMobileDrawerOpen(false);
    triggerRefresh();
    feedScrollRef.current?.scrollTo?.({ y: 0, animated: true });
  }, [triggerRefresh]);

  const handleLibraryClick = useCallback((kind: LibraryKind) => {
    setLibrary(kind);
    setMobileDrawerOpen(false);
  }, []);

  // PC 사이드바 너비 조절 (기본 30%)
  const [sidebarRatio, setSidebarRatio] = useState<number>(0.3);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const sidebarWidth = useMemo(() => {
    return Math.max(160, Math.min(width * 0.55, width * sidebarRatio));
  }, [width, sidebarRatio]);

  const handleMouseDown = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      setIsResizing(true);
      e.preventDefault?.();

      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }

      const onMouseMove = (moveEvt: MouseEvent) => {
        const windowW = typeof window !== 'undefined' ? window.innerWidth : width;
        const newRatio = moveEvt.clientX / windowW;
        const clamped = Math.max(0.15, Math.min(0.55, newRatio));
        setSidebarRatio(clamped);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [width],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setIsResizing(true),
        onPanResponderMove: (_evt, gestureState) => {
          const newRatio = gestureState.moveX / width;
          const clamped = Math.max(0.15, Math.min(0.55, newRatio));
          setSidebarRatio(clamped);
        },
        onPanResponderRelease: () => setIsResizing(false),
        onPanResponderTerminate: () => setIsResizing(false),
      }),
    [width],
  );

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const topCategories = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order),
    [categories],
  );

  const subCategoriesByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (c.parentId) {
        const list = map.get(c.parentId) ?? [];
        list.push(c);
        map.set(
          c.parentId,
          list.sort((a, b) => a.order - b.order),
        );
      }
    }
    return map;
  }, [categories]);

  const channelsByCat = useMemo(() => {
    const map = new Map<string, Channel[]>();
    for (const ch of channels) {
      const catId = ch.categoryId ?? '__none__';
      const list = map.get(catId) ?? [];
      list.push(ch);
      map.set(catId, list);
    }
    return map;
  }, [channels]);

  const toggleCatExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // 실제 YouTube 구독 채널이 있는지 (없으면 둘러보기 — 데모 영상으로 채운다)
  const hasRealChannels = useMemo(() => channels.some((c) => /^UC[\w-]{10,}$/.test(c.id)), [channels]);

  // 피드용 비디오 목록 구성
  const feedVideos = useMemo(() => {
    const list: FeedVideoItem[] = [];

    const dated: (FeedVideoItem & { publishedAt: string })[] = [];
    for (const ch of channels) {
      const vids = recentVideos[ch.id];
      if (vids && vids.length > 0) {
        for (const v of vids) {
          if (v.isShort || v.id.startsWith('sample-')) continue;
          dated.push({
            id: v.id,
            title: v.title,
            thumbnail: thumbUrl(v.id, thumbQuality, v.thumbnail),
            duration: '',
            channelId: ch.id,
            channelTitle: ch.title,
            channelAvatar: ch.thumbnail,
            views: '',
            timeAgo: timeAgo(v.publishedAt),
            categoryId: ch.categoryId,
            publishedAt: v.publishedAt,
          });
        }
      }
    }
    // 최신순
    dated.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    list.push(...dated);

    // 데모 영상은 실제 구독 채널이 하나도 없을 때(둘러보기)만 보여 준다.
    if (!hasRealChannels) {
      const existingIds = new Set(list.map((v) => v.id));
      for (const s of SAMPLE_VIDEOS) {
        if (!existingIds.has(s.id)) list.push(s);
      }
    }

    if (selectedCategory === 'all') return list;

    return list.filter((v) => {
      if (!v.categoryId) return false;
      if (v.categoryId === selectedCategory) return true;
      const cat = categoryById.get(v.categoryId);
      return cat?.parentId === selectedCategory;
    });
  }, [channels, recentVideos, selectedCategory, categoryById, thumbQuality, refreshTick, hasRealChannels]);

  // 쇼츠 목록
  const feedShorts = useMemo(() => {
    const real: (FeedVideoItem & { publishedAt: string })[] = [];
    for (const ch of channels) {
      for (const v of recentVideos[ch.id] ?? []) {
        if (!v.isShort) continue;
        real.push({
          id: v.id,
          title: v.title,
          thumbnail: thumbUrl(v.id, thumbQuality, v.thumbnail),
          duration: '',
          channelId: ch.id,
          channelTitle: ch.title,
          channelAvatar: ch.thumbnail,
          views: '',
          timeAgo: '',
          categoryId: ch.categoryId,
          isShort: true,
          publishedAt: v.publishedAt,
        });
      }
    }
    real.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    const source: FeedVideoItem[] = real.length > 0 || hasRealChannels ? real.slice(0, 40) : SAMPLE_SHORTS;
    if (selectedCategory === 'all') return source;
    return source.filter((s) => {
      if (!s.categoryId) return false;
      if (s.categoryId === selectedCategory) return true;
      const cat = categoryById.get(s.categoryId);
      return cat?.parentId === selectedCategory;
    });
  }, [channels, recentVideos, selectedCategory, categoryById, thumbQuality, refreshTick]);

  const topPad = Platform.OS === 'web' ? 76 : safeArea.top + Spacing.two;

  const head = (
    <Head>
      <title>홈 - 마이 튜브</title>
      <meta
        name="description"
        content="구독한 채널들의 최신 영상과 쇼츠를 대분류·소분류별로 모아보는 나만의 유튜브 홈"
      />
    </Head>
  );

  /** 공통 사이드바 컨텐츠 렌더러 (PC 고정 사이드바 및 모바일 슬라이드 드로어 양쪽에서 동일하게 사용) */
  const renderSidebarContent = () => (
    <View style={styles.sidebarContent}>
      {/* 상단 기본 메뉴: 홈 & Shorts */}
      <Pressable
        onPress={handleHomeClick}
        style={[
          styles.sideMenuItem,
          !library &&
            !shortsOnly &&
            selectedCategory === 'all' && [styles.sideMenuActive, { backgroundColor: theme.backgroundSelected }],
        ]}>
        <MaterialCommunityIcons
          name="home-variant"
          size={22}
          color={!library && !shortsOnly && selectedCategory === 'all' ? '#ff0033' : theme.text}
        />
        <Text
          style={[
            styles.sideMenuLabel,
            { color: theme.text },
            !library && !shortsOnly && selectedCategory === 'all' && styles.sideMenuLabelActive,
          ]}>
          홈
        </Text>
      </Pressable>

      <Pressable
        onPress={handleShortsClick}
        style={[
          styles.sideMenuItem,
          !library && shortsOnly && [styles.sideMenuActive, { backgroundColor: theme.backgroundSelected }],
        ]}>
        <MaterialCommunityIcons
          name="lightning-bolt"
          size={22}
          color={!library && shortsOnly ? '#ff0033' : theme.text}
        />
        <Text
          style={[
            styles.sideMenuLabel,
            { color: theme.text },
            !library && shortsOnly && styles.sideMenuLabelActive,
          ]}>
          Shorts
        </Text>
      </Pressable>

      {/* 구분선 */}
      <View style={[styles.sideDivider, { backgroundColor: theme.backgroundSelected }]} />

      {/* 내 보관함: 기록 · 재생목록 · 나중에 볼 동영상 */}
      {(
        [
          { kind: 'history', label: '기록', icon: 'history' },
          { kind: 'playlists', label: '재생목록', icon: 'playlist-play' },
          {
            kind: 'later',
            label: '나중에 볼 동영상',
            icon: 'clock-outline',
          },
        ] as const
      ).map((m) => (
        <Pressable
          key={m.kind}
          onPress={() => handleLibraryClick(m.kind)}
          style={[
            styles.sideMenuItem,
            library === m.kind && [styles.sideMenuActive, { backgroundColor: theme.backgroundSelected }],
          ]}>
          <MaterialCommunityIcons name={m.icon} size={22} color={library === m.kind ? '#ff0033' : theme.text} />
          <Text
            style={[
              styles.sideMenuLabel,
              { color: theme.text },
              library === m.kind && styles.sideMenuLabelActive,
            ]}>
            {m.label}
          </Text>
        </Pressable>
      ))}

      <View style={[styles.sideDivider, { backgroundColor: theme.backgroundSelected }]} />

      {/* 구독 섹션 헤더 (클릭 시 구독 관리 화면 /subscriptions 로 이동) */}
      <Pressable
        onPress={() => {
          setMobileDrawerOpen(false);
          router.push('/subscriptions');
        }}
        style={styles.subHeaderRow}>
        <Text style={[styles.sideSectionTitle, { color: theme.text }]}>구독</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

      {/* 대분류 & 소분류 아코디언 트리 */}
      <View style={styles.categoryTree}>
        {topCategories.map((topCat) => {
          const isExpanded = !!expandedCats[topCat.id];
          const subCats = subCategoriesByParent.get(topCat.id) ?? [];
          const catChannels = channelsByCat.get(topCat.id) ?? [];
          const isSelected = selectedCategory === topCat.id;

          return (
            <View key={topCat.id} style={styles.catGroup}>
              {/* 대분류 항목 */}
              <Pressable
                onPress={() => handleCategoryClick(topCat.id)}
                style={[
                  styles.catItemRow,
                  isSelected && [styles.sideMenuActive, { backgroundColor: theme.backgroundSelected }],
                ]}>
                <View style={[styles.catColorDot, { backgroundColor: topCat.color }]} />
                <Text style={styles.catEmoji}>{topCat.emoji}</Text>
                <Text
                  style={[styles.catName, { color: theme.text }, isSelected && styles.sideMenuLabelActive]}
                  numberOfLines={1}>
                  {topCat.name}
                </Text>

                {/* 하위 항목(소분류나 채널)이 있으면 토글 아이콘 */}
                {(subCats.length > 0 || catChannels.length > 0) && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCatExpand(topCat.id);
                    }}
                    hitSlop={8}
                    style={styles.expandHit}>
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-down' : 'chevron-right'}
                      size={16}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                )}
              </Pressable>

              {/* 펼쳐졌을 때: 소분류 및 소속 채널들 */}
              {isExpanded && (
                <View style={styles.subCatContainer}>
                  {/* 소분류 목록 */}
                  {subCats.map((sub) => {
                    const subChannels = channelsByCat.get(sub.id) ?? [];
                    const isSubSelected = selectedCategory === sub.id;
                    return (
                      <Pressable
                        key={sub.id}
                        onPress={() => handleCategoryClick(sub.id)}
                        style={[
                          styles.subCatRow,
                          isSubSelected && {
                            backgroundColor: theme.backgroundSelected,
                          },
                        ]}>
                        <Text style={styles.subCatEmoji}>{sub.emoji}</Text>
                        <Text
                          style={[
                            styles.subCatName,
                            { color: theme.text },
                            isSubSelected && { fontWeight: '700' },
                          ]}
                          numberOfLines={1}>
                          {sub.name}
                        </Text>
                        <Text style={[styles.subCatCount, { color: theme.textSecondary }]}>
                          {subChannels.length}
                        </Text>
                      </Pressable>
                    );
                  })}

                  {/* 대분류 바로 아래 채널 목록 */}
                  {catChannels.slice(0, 5).map((ch) => (
                    <Pressable
                      key={ch.id}
                      onPress={() => {
                        setMobileDrawerOpen(false);
                        Linking.openURL(channelUrl(ch));
                      }}
                      style={styles.channelSideRow}>
                      {ch.thumbnail ? (
                        <Image source={{ uri: ch.thumbnail }} style={styles.channelSideAvatar} />
                      ) : (
                        <View style={[styles.channelSideAvatarFallback, { backgroundColor: topCat.color }]}>
                          <Text style={styles.channelSideInitial}>{ch.title.slice(0, 1)}</Text>
                        </View>
                      )}
                      <Text style={[styles.channelSideTitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {ch.title}
                      </Text>
                      <View style={styles.sideLiveDot} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.root, { paddingTop: topPad }]}>
      {head}
      <View style={styles.layoutRow}>
        {/* ============================================================ */}
        {/* 1. PC 좌측 사이드바 (YouTube 스타일 네비게이션 & 구독 폴더 트리) */}
        {/* ============================================================ */}
        {!isMobile && (
          <ScrollView
            style={[
              styles.sidebar,
              {
                backgroundColor: theme.background,
                borderRightColor: theme.backgroundSelected,
                width: sidebarWidth,
                maxWidth: sidebarWidth,
                minWidth: 160,
                flexBasis: sidebarWidth,
                flexGrow: 0,
                flexShrink: 0,
              },
            ]}
            showsVerticalScrollIndicator={false}>
            {renderSidebarContent()}
          </ScrollView>
        )}

        {/* ============================================================ */}
        {/* 1.5 좌우 분할 크기 조절 바 (Resizable Split Divider) */}
        {/* ============================================================ */}
        {!isMobile && (
          <View
            {...panResponder.panHandlers}
            // @ts-expect-error web mouse event
            onMouseDown={handleMouseDown}
            style={[
              styles.resizerBar,
              {
                backgroundColor: isResizing ? '#ff0033' : theme.backgroundSelected,
                cursor: 'col-resize',
              } as any,
            ]}>
            <View
              style={[
                styles.resizerHandle,
                {
                  backgroundColor: isResizing ? '#ffffff' : theme.textSecondary,
                },
              ]}
            />
          </View>
        )}

        {/* ============================================================ */}
        {/* 2. 메인 피드 영역 (상단 대분류 칩 + 영상 그리드 + Shorts 스트립) */}
        {/* ============================================================ */}
        <View style={styles.mainFeed}>
          {/* 상단 가로 스크롤 대분류 칩 (모바일 ☰ 햄버거 메뉴 버튼 포함) */}
          <View style={[styles.chipBar, { backgroundColor: theme.background }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {/* 스마트폰 화면 전용 햄버거 메뉴 버튼 */}
              {isMobile && (
                <Pressable
                  onPress={() => setMobileDrawerOpen(true)}
                  style={[styles.chipItem, styles.mobileMenuChip, { backgroundColor: theme.backgroundSelected }]}
                  accessibilityLabel="사이드바 메뉴 열기">
                  <MaterialCommunityIcons name="menu" size={18} color={theme.text} />
                  <Text style={[styles.chipText, { color: theme.text, marginLeft: 4 }]}>메뉴</Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleHomeClick}
                style={[
                  styles.chipItem,
                  { backgroundColor: theme.backgroundElement },
                  selectedCategory === 'all' && !shortsOnly && [styles.chipActive, { backgroundColor: theme.text }],
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    { color: theme.text },
                    selectedCategory === 'all' && !shortsOnly && [styles.chipTextActive, { color: theme.background }],
                  ]}>
                  전체
                </Text>
              </Pressable>

              {topCategories.map((cat) => {
                const isActive = selectedCategory === cat.id && !shortsOnly;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleCategoryClick(cat.id)}
                    style={[
                      styles.chipItem,
                      { backgroundColor: theme.backgroundElement },
                      isActive && [styles.chipActive, { backgroundColor: theme.text }],
                    ]}>
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.text },
                        isActive && [styles.chipTextActive, { color: theme.background }],
                      ]}>
                      {cat.emoji} {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 메인 비디오 목록 스크롤뷰 */}
          {library ? (
            <LibraryView kind={library} />
          ) : (
            <ScrollView
              ref={feedScrollRef}
              contentContainerStyle={[styles.feedContent, isMobile && styles.feedContentMobile]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={triggerRefresh}
                  tintColor="#ff0033"
                  colors={['#ff0033']}
                />
              }>
              {!shortsOnly && hasRealChannels && feedVideos.length === 0 && (
                <View style={styles.feedEmpty}>
                  <Text style={[styles.feedEmptyTitle, { color: theme.text }]}>아직 이 기기에 최신 영상이 없어요</Text>
                  <Text style={[styles.feedEmptyBody, { color: theme.textSecondary }]}>
                    [구독] 화면의 ⏰ 를 눌러 확인하면 채널별 최신 영상이 여기에 모여요. 다른 기기(컴퓨터 등)에서 확인한
                    영상도 같은 계정이면 잠시 뒤 여기에 함께 나와요.
                  </Text>
                  <Pressable onPress={() => router.push('/subscriptions')} style={styles.feedEmptyBtn}>
                    <Text style={styles.feedEmptyBtnText}>구독 화면으로</Text>
                  </Pressable>
                </View>
              )}
              {/* 일반 영상 그리드 (상단 행) */}
              {!shortsOnly && (
                <View style={[styles.videoGrid, isMobile && styles.videoGridMobile]}>
                  {feedVideos.slice(0, 3).map((item) => (
                    <VideoCard key={item.id} item={item} isMobile={isMobile} onMore={setSaveTarget} />
                  ))}
                </View>
              )}

              {/* ============================================================ */}
              {/* 3. Shorts 섹션 */}
              {/* ============================================================ */}
              <View style={styles.shortsSection}>
                <View style={styles.shortsHeader}>
                  <View style={styles.shortsTitleRow}>
                    <MaterialCommunityIcons name="lightning-bolt" size={26} color="#ff0033" />
                    <Text style={[styles.shortsHeading, { color: theme.text }]}>Shorts</Text>
                  </View>
                  <Text style={[styles.shortsSub, { color: theme.textSecondary }]}>구독 채널의 최신 숏폼 영상</Text>
                </View>

                {shortsBlocked ? (
                  <Text style={[styles.shortsSub, { color: theme.textSecondary, paddingVertical: 24 }]}>
                    ⏳ 오늘 정한 Shorts 시간({shortsLimitMin}분)을 다 봤어요. 내일 다시 볼 수 있어요.
                  </Text>
                ) : shortsOnly && isMobile ? (
                  <View style={styles.shortsGridMobile}>
                    {feedShorts.map((short) => (
                      <View key={short.id} style={styles.shortsGridCol}>
                        <ShortsCard item={short} onMore={setSaveTarget} fullWidth />
                      </View>
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.shortsScroll}>
                    {feedShorts.map((short) => (
                      <ShortsCard key={short.id} item={short} onMore={setSaveTarget} />
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* 일반 영상 그리드 (하단 행) */}
              {!shortsOnly && feedVideos.length > 3 && (
                <View style={[styles.videoGrid, isMobile && styles.videoGridMobile, { marginTop: 24 }]}>
                  {feedVideos.slice(3).map((item) => (
                    <VideoCard key={item.id} item={item} isMobile={isMobile} onMore={setSaveTarget} />
                  ))}
                </View>
              )}

              {/* 하단 패딩 */}
              <View style={{ height: 60 }} />
            </ScrollView>
          )}
          <SaveVideoMenu video={saveTarget} onClose={() => setSaveTarget(null)} />
        </View>
      </View>

      {/* ============================================================ */}
      {/* 4. 모바일 전용 슬라이드 드로어 (PC와 100% 동일한 사이드바 기능 제공) */}
      {/* ============================================================ */}
      {isMobile && (
        <Modal
          visible={mobileDrawerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMobileDrawerOpen(false)}>
          <View style={styles.drawerBackdrop}>
            {/* 배경 터치 시 닫기 */}
            <Pressable
              style={styles.drawerBackdropHit}
              onPress={() => setMobileDrawerOpen(false)}
              accessibilityLabel="메뉴 닫기"
            />
            {/* 좌측 슬라이드 패널 */}
            <View
              style={[
                styles.drawerPanel,
                {
                  backgroundColor: theme.background,
                  borderRightColor: theme.backgroundSelected,
                  width: Math.min(320, width * 0.82),
                  paddingTop: safeArea.top + 12,
                },
              ]}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerHeaderLeft}>
                  <MaterialCommunityIcons name="youtube" size={26} color="#ff0033" />
                  <Text style={[styles.drawerHeaderTitle, { color: theme.text }]}>마이 튜브</Text>
                </View>
                <Pressable
                  onPress={() => setMobileDrawerOpen(false)}
                  style={styles.drawerCloseButton}
                  accessibilityLabel="닫기">
                  <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {renderSidebarContent()}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

/** 실제 유튜브 영상 id (11자) */
const isRealVideoId = (id: string) => /^[\w-]{11}$/.test(id);

/** 보관함(기록·재생목록)에 담을 형태로 변환 */
const toSaved = (item: FeedVideoItem) => ({
  id: item.id,
  title: item.title,
  thumbnail: item.thumbnail,
  channelId: item.channelId,
  channelTitle: item.channelTitle,
  isShort: item.isShort,
});

/** 카드의 ⋮ 버튼 → 나중에 볼 동영상 · 재생목록에 저장 */
function MoreButton({ onPress, color }: { onPress: () => void; color?: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        onPress();
      }}
      hitSlop={8}
      aria-label="저장 메뉴 열기"
      style={({ pressed }) => [{ padding: 4, borderRadius: 999 }, pressed && { opacity: 0.6 }]}>
      <MaterialCommunityIcons name="dots-vertical" size={20} color={color ?? theme.textSecondary} />
    </Pressable>
  );
}

/** 16:9 유튜브 일반 비디오 카드 */
function VideoCard({
  item,
  isMobile,
  onMore,
}: {
  item: FeedVideoItem;
  isMobile: boolean;
  onMore: (item: FeedVideoItem) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() =>
        isRealVideoId(item.id)
          ? openVideo(toSaved(item))
          : Linking.openURL(channelUrl({ id: item.channelId, title: item.channelTitle }))
      }
      style={({ pressed }) => [styles.videoCard, isMobile && styles.videoCardMobile, pressed && { opacity: 0.9 }]}>
      <View style={styles.thumbBox}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbImage} resizeMode="cover" />
        {item.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        {item.channelAvatar ? (
          <Image source={{ uri: item.channelAvatar }} style={styles.metaAvatar} />
        ) : (
          <View style={[styles.metaAvatarFallback, { backgroundColor: '#8B5CF6' }]}>
            <Text style={styles.metaInitial}>{item.channelTitle.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.metaInfo}>
          <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.channelNameRow}>
            <Text style={[styles.channelTitleText, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.channelTitle}
            </Text>
            <MaterialCommunityIcons name="check-circle" size={13} color={theme.textSecondary} />
          </View>
          <Text style={[styles.videoStats, { color: theme.textSecondary }]}>
            {item.views ? `${item.views} · ${item.timeAgo}` : item.timeAgo}
          </Text>
        </View>
        {isRealVideoId(item.id) && <MoreButton onPress={() => onMore(item)} />}
      </View>
    </Pressable>
  );
}

/** 9:16 유튜브 세로형 쇼츠 카드 */
function ShortsCard({
  item,
  onMore,
  fullWidth,
}: {
  item: FeedVideoItem;
  onMore: (item: FeedVideoItem) => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={() =>
        isRealVideoId(item.id)
          ? openVideo(toSaved({ ...item, isShort: true }))
          : Linking.openURL('https://www.youtube.com/shorts')
      }
      style={({ pressed }) => [
        styles.shortsCard,
        fullWidth && styles.shortsCardFull,
        pressed && { opacity: 0.9 },
      ]}>
      <Image source={{ uri: item.thumbnail }} style={styles.shortsThumb} resizeMode="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.shortsOverlay}>
        <Text style={styles.shortsCardTitle} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.shortsViewsText}>{item.views ? `조회수 ${item.views}` : item.channelTitle}</Text>
      </LinearGradient>
      {isRealVideoId(item.id) && (
        <View style={styles.shortsMore}>
          <MoreButton onPress={() => onMore({ ...item, isShort: true })} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  feedEmpty: { padding: 24, gap: 10, alignItems: 'flex-start' },
  feedEmptyTitle: { fontSize: 17, fontWeight: '800' },
  feedEmptyBody: { fontSize: 14, lineHeight: 21 },
  feedEmptyBtn: { backgroundColor: '#ff0033', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  feedEmptyBtnText: { color: '#fff', fontWeight: '700' },
  root: { flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' },
  layoutRow: { flex: 1, flexDirection: 'row', width: '100%', maxWidth: '100%', overflow: 'hidden' },

  // 좌측 사이드바
  sidebar: {
    borderRightWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
  },
  sidebarContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  sideMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  sideMenuActive: {
    borderRadius: 10,
  },
  sideMenuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sideMenuLabelActive: {
    fontWeight: '800',
  },
  sideDivider: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 8,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sideSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  // 카테고리 트리
  categoryTree: {
    gap: 2,
    marginTop: 4,
  },
  catGroup: {
    marginBottom: 2,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  catColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catEmoji: { fontSize: 15 },
  catName: { fontSize: 13, fontWeight: '600', flex: 1 },
  expandHit: { padding: 4 },

  subCatContainer: {
    paddingLeft: 20,
    marginTop: 2,
    gap: 2,
  },
  subCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  subCatEmoji: { fontSize: 13 },
  subCatName: { fontSize: 12, flex: 1 },
  subCatCount: { fontSize: 11 },

  channelSideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  channelSideAvatar: { width: 22, height: 22, borderRadius: 11 },
  channelSideAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelSideInitial: { color: '#fff', fontSize: 10, fontWeight: '700' },
  channelSideTitle: { fontSize: 12, flex: 1 },
  sideLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },

  // 좌우 너비 조절 드래그 바
  resizerBar: {
    width: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  resizerHandle: {
    width: 2,
    height: 36,
    borderRadius: 2,
    opacity: 0.7,
  },

  // 메인 피드
  mainFeed: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  chipBar: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  mobileMenuChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  chipItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chipActive: {},
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    fontWeight: '800',
  },

  feedContent: {
    padding: 16,
  },
  feedContentMobile: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '100%',
    maxWidth: '100%',
  },

  // 비디오 그리드
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  videoGridMobile: {
    flexDirection: 'column',
    gap: 20,
    width: '100%',
    maxWidth: '100%',
  },
  videoCard: {
    flex: 1,
    minWidth: 280,
    maxWidth: 420,
    gap: 10,
  },
  videoCardMobile: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
  },
  thumbBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  metaAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaInitial: { color: '#fff', fontSize: 14, fontWeight: '700' },
  metaInfo: { flex: 1, gap: 3 },
  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  channelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  channelTitleText: {
    fontSize: 13,
  },
  videoStats: {
    fontSize: 12,
  },

  // 쇼츠 섹션
  shortsSection: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    marginTop: 28,
    marginBottom: 8,
    gap: 14,
  },
  shortsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  shortsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shortsHeading: {
    fontSize: 20,
    fontWeight: '900',
  },
  shortsSub: {
    fontSize: 12,
  },
  shortsScroll: {
    gap: 14,
    paddingRight: 16,
  },
  shortsCard: {
    width: 170,
    height: 290,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
  },
  shortsCardFull: {
    width: '100%',
    height: undefined,
    aspectRatio: 9 / 16,
  },
  shortsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  shortsGridCol: {
    width: '48%',
    flexGrow: 1,
  },
  shortsThumb: {
    width: '100%',
    height: '100%',
  },
  shortsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 4,
  },
  shortsMore: { position: 'absolute', top: 6, right: 4 },
  shortsCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  shortsViewsText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '600',
  },

  // 모바일 드로어
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flexDirection: 'row',
  },
  drawerBackdropHit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerPanel: {
    height: '100%',
    borderRightWidth: 1,
    elevation: 16,
    boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
    zIndex: 100,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  drawerCloseButton: {
    padding: 6,
    borderRadius: 8,
  },
});
