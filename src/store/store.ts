import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CategoryColors, CategoryEmojis, DefaultCategories } from '@/constants/categories';
import { ManualClassification } from '@/data/manualClassification';
import { MockChannels } from '@/data/mockChannels';
import { classifyChannels } from '@/services/classify';
import { AdminSettings, Category, Channel, ChannelAlert, Playlist, SavedVideo, Video } from '@/types';

/**
 * YouTube Data API 키 형식 (구글 API 키는 'AIza' 로 시작하는 39자).
 * OAuth 클라이언트 ID(…apps.googleusercontent.com)를 잘못 넣으면 모든 조회가 실패하므로 걸러 낸다.
 */
export const isValidYouTubeApiKey = (key: string | null | undefined) => /^AIza[0-9A-Za-z_-]{30,}$/.test((key ?? '').trim());

export const DefaultAdminSettings: AdminSettings = {
  dailyLimitOn: false,
  dailyLimitMin: 60,
  shortsLimitOn: false,
  shortsLimitMin: 15,
  desktopNotify: true,
  notifyNewVideos: true,
  notifyWatchTime: true,
  notifyTimeLimit: true,
  notifyNews: false,
  language: 'ko',
  openInNewTab: true,
  shortsInPlayer: false,
  thumbQuality: 'high',
  pauseHistory: false,
  shareIncludesChannel: true,
  cloudSyncOn: true,
  apps: {
    notion: { connected: false, values: {} },
    kakao: { connected: false, values: {} },
    instagram: { connected: false, values: {} },
    facebook: { connected: false, values: {} },
    x: { connected: false, values: {} },
  },
  aiServer: 'http://localhost:11434',
  aiModel: 'qwen3.8',
  aiEnabled: false,
};

const HISTORY_MAX = 200;

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.round(Math.random() * 1e6).toString(36)}`;
}

interface AppState {
  categories: Category[];
  channels: Channel[];
  /** persist 복원이 끝났는지. 화면에서 로딩 처리에 사용. */
  hydrated: boolean;
  setHydrated: () => void;

  // --- YouTube 연동 ---
  /** 사용자가 발급한 구글 OAuth 클라이언트 ID. */
  googleClientId: string;
  /** "웹 애플리케이션" 유형 클라이언트에 필요한 비밀키 (선택). */
  googleClientSecret: string;
  /** 실제 유튜브 구독을 한 번이라도 불러왔는지. */
  youtubeConnected: boolean;
  setGoogleAuth: (clientId: string, clientSecret: string) => void;
  /** YouTube Data API 키 (선택). 있으면 로그인 없이 최신 영상을 불러온다. */
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  /** 유튜브에서 가져온 채널을 자동 분류해 병합 (기존 이동 내역은 보존). */
  importYouTubeChannels: (raw: Omit<Channel, 'categoryId'>[]) => void;
  disconnectYouTube: () => void;

  // --- 새 영상 알림 ---
  /** implicit 흐름으로 받은 짧은 수명(약 1시간) 액세스 토큰. 새 영상 확인에 쓴다. */
  accessToken: string | null;
  tokenExpiresAt: number | null;
  /** 채널별 최신 영상 (최신순 최대 6개). */
  recentVideos: Record<string, Video[]>;
  lastCheckedAt: number | null;
  /** 첫 확인 시각 - 24시간. 이보다 오래된 영상은 '새 영상'으로 치지 않는다. */
  baselineAt: number | null;
  /** 탭(분류함 id 또는 미분류)을 마지막으로 열어 본 시각. 그 뒤에 올라온 영상만 새 영상. */
  seenAt: Record<string, number>;
  /** 홈에서 로그인이 필요할 때 설정 화면의 연결 창을 열어 달라는 요청 (저장하지 않음). */
  connectRequested: boolean;
  setToken: (token: string, expiresAt: number) => void;
  saveRecentVideos: (uploads: Record<string, Video[]>, checkedAt: number) => void;
  markSeen: (tabKey: string) => void;
  setConnectRequested: (v: boolean) => void;

  // --- 채널별 '볼 시간' 알림 ---
  channelAlerts: Record<string, ChannelAlert>;
  /** 웹에서 마지막으로 알림을 띄운 시각 (같은 알림을 두 번 띄우지 않기 위해). */
  alertFiredAt: Record<string, number>;
  /** null 이면 알림 끄기. */
  setChannelAlert: (channelId: string, alert: ChannelAlert | null) => void;
  markAlertFired: (channelId: string, at: number) => void;

  // --- 내 보관함: 기록 · 나중에 볼 동영상 · 재생목록 (이 기기에 저장) ---
  /** 이 앱에서 열어 본 영상 (최신순, 최대 200개). */
  watchHistory: SavedVideo[];
  watchLater: SavedVideo[];
  playlists: Playlist[];
  addToHistory: (v: Omit<SavedVideo, 'at'>) => void;
  removeFromHistory: (videoId: string) => void;
  clearHistory: () => void;
  /** 나중에 볼 동영상에 있으면 빼고, 없으면 맨 앞에 넣는다. */
  toggleWatchLater: (v: Omit<SavedVideo, 'at'>) => void;
  /** 새 재생목록을 만들고 id 를 돌려준다. */
  createPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  /** 재생목록에 있으면 빼고, 없으면 끝에 넣는다. */
  togglePlaylistItem: (playlistId: string, v: Omit<SavedVideo, 'at'>) => void;

  // --- 관리자 ---
  adminSettings: AdminSettings;
  setAdminSettings: (patch: Partial<AdminSettings>) => void;
  /** 관리자 2차 로그인 비밀번호의 해시 (salt 포함). 없으면 처음 들어갈 때 정한다. */
  adminPinHash: string | null;
  setAdminPinHash: (hash: string | null) => void;
  /** 관리자 2차 로그인 유효 시각 (저장 안 함 — 새로고침하면 다시 로그인). */
  adminUnlockedUntil: number;
  setAdminUnlockedUntil: (t: number) => void;
  /** 지금 Shorts 화면을 보고 있는지 (저장 안 함 — Shorts 사용 시간 계산용). */
  viewingShorts: boolean;
  setViewingShorts: (v: boolean) => void;
  /** 오늘 사용 시간 (초). date 가 바뀌면 0 부터. */
  usage: { date: string; appSec: number; shortsSec: number };
  addUsage: (appSec: number, shortsSec: number) => void;

  // --- 계정 · 클라우드 동기화 (Supabase) ---
  /** 소개(랜딩) 페이지를 지나 앱으로 들어왔는지 (둘러보기·로그인·가입 완료). */
  introDone: boolean;
  setIntroDone: (v: boolean) => void;
  /** 소개 화면을 다시 열 때 어느 화면부터 보여 줄지 (설정의 '로그인/회원가입'). 저장 안 함. */
  landingMode: 'home' | 'login' | 'signup';
  openLanding: (mode: 'home' | 'login' | 'signup') => void;
  /** 휴대폰 인증~가입 완료 사이 (이때 생긴 로그인 세션 때문에 소개 화면이 닫히지 않도록). 저장 안 함. */
  signupInProgress: boolean;
  setSignupInProgress: (v: boolean) => void;
  /** 이 기기 데이터가 마지막으로 동기화된 계정. 다른 계정으로 로그인하면 데이터를 섞지 않는다. */
  syncedUserId: string | null;
  setSyncedUserId: (id: string | null) => void;
  syncStatus: 'off' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: number | null;
  syncError: string;
  setSyncState: (patch: Partial<{ syncStatus: AppState['syncStatus']; lastSyncedAt: number | null; syncError: string }>) => void;
  /** 클라우드에서 받은(또는 합친) 데이터로 한꺼번에 바꾼다. */
  replaceData: (d: {
    categories: Category[];
    channels: Channel[];
    channelAlerts: Record<string, ChannelAlert>;
    googleClientId: string;
    youtubeConnected: boolean;
    seenAt: Record<string, number>;
    baselineAt: number | null;
    lastCheckedAt: number | null;
  }) => void;

  // --- 카테고리 ---
  /** 새 분류함을 만들고 그 id 를 돌려준다. parentId 를 주면 그 아래 하위 분류함이 된다. */
  addCategory: (name: string, emoji?: string, color?: string, parentId?: string | null) => string;
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'emoji' | 'color'>>) => void;
  deleteCategory: (id: string) => void;

  // --- 채널 ---
  /** 데모 구독 목록을 불러와 자동 분류. */
  importDemoChannels: () => void;
  /** 채널을 다른 분류함으로 이동 (null = 미분류). */
  moveChannel: (channelId: string, categoryId: string | null) => void;
  /** 채널 목록만 비우기 (카테고리는 유지). */
  clearChannels: () => void;
  /** 카테고리·채널 모두 기본값으로 초기화. */
  resetAll: () => void;
  /** 백업 파일(검사를 마친 것)로 분류함·채널·알림·최근 영상을 바꾼다. 로그인·키 정보는 건드리지 않는다. */
  restoreBackup: (b: {
    categories: Category[];
    channels: Channel[];
    channelAlerts: Record<string, ChannelAlert>;
    recentVideos: Record<string, Video[]>;
    lastCheckedAt: number | null;
    baselineAt: number | null;
    seenAt: Record<string, number>;
  }) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      categories: DefaultCategories,
      channels: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      googleClientId: '',
      googleClientSecret: '',
      youtubeConnected: false,
      youtubeApiKey: '',
      setYoutubeApiKey: (key) => set({ youtubeApiKey: isValidYouTubeApiKey(key) ? key.trim() : '' }),
      setGoogleAuth: (clientId, clientSecret) =>
        set({ googleClientId: clientId.trim(), googleClientSecret: clientSecret.trim() }),
      importYouTubeChannels: (raw) => {
        const classified = classifyChannels(raw, get().categories);
        // 기존에 있던 채널은 사용자가 옮겨둔 분류(categoryId)를 유지하고, 정보만 갱신.
        const existing = new Map(get().channels.map((c) => [c.id, c]));
        const merged = classified.map((ch) => {
          const prev = existing.get(ch.id);
          return prev ? { ...ch, categoryId: prev.categoryId } : ch;
        });
        set({ channels: merged, youtubeConnected: true });
      },
      disconnectYouTube: () =>
        set({ youtubeConnected: false, accessToken: null, tokenExpiresAt: null }),

      accessToken: null,
      tokenExpiresAt: null,
      recentVideos: {},
      lastCheckedAt: null,
      baselineAt: null,
      seenAt: {},
      connectRequested: false,
      setToken: (token, expiresAt) => set({ accessToken: token, tokenExpiresAt: expiresAt }),
      saveRecentVideos: (uploads, checkedAt) =>
        set((s) => ({
          // 이번에 못 가져온 채널은 이전 기록을 유지한다.
          recentVideos: { ...s.recentVideos, ...uploads },
          lastCheckedAt: checkedAt,
          baselineAt: s.baselineAt ?? checkedAt - 24 * 60 * 60 * 1000,
        })),
      markSeen: (tabKey) => set((s) => ({ seenAt: { ...s.seenAt, [tabKey]: Date.now() } })),
      setConnectRequested: (v) => set({ connectRequested: v }),

      channelAlerts: {},
      alertFiredAt: {},
      setChannelAlert: (channelId, alert) =>
        set((s) => {
          const channelAlerts = { ...s.channelAlerts };
          if (alert) channelAlerts[channelId] = alert;
          else delete channelAlerts[channelId];
          // 이미 지나간 오늘 시각으로 저장해도 곧바로 울리지 않도록 '지금 울린 것'으로 둔다.
          return { channelAlerts, alertFiredAt: { ...s.alertFiredAt, [channelId]: Date.now() } };
        }),
      markAlertFired: (channelId, at) =>
        set((s) => ({ alertFiredAt: { ...s.alertFiredAt, [channelId]: at } })),

      adminSettings: DefaultAdminSettings,
      setAdminSettings: (patch) => set((s) => ({ adminSettings: { ...s.adminSettings, ...patch } })),
      adminPinHash: null,
      setAdminPinHash: (hash) => set({ adminPinHash: hash }),
      adminUnlockedUntil: 0,
      setAdminUnlockedUntil: (t) => set({ adminUnlockedUntil: t }),
      viewingShorts: false,
      setViewingShorts: (v) => set({ viewingShorts: v }),
      usage: { date: '', appSec: 0, shortsSec: 0 },
      addUsage: (appSec, shortsSec) =>
        set((s) => {
          const today = new Date().toLocaleDateString('sv-SE');
          const base = s.usage.date === today ? s.usage : { date: today, appSec: 0, shortsSec: 0 };
          return { usage: { date: today, appSec: base.appSec + appSec, shortsSec: base.shortsSec + shortsSec } };
        }),

      watchHistory: [],
      watchLater: [],
      playlists: [],
      addToHistory: (v) =>
        set((s) =>
          // 공개 범위 설정의 '기록 일시중지'가 켜져 있으면 남기지 않는다.
          s.adminSettings.pauseHistory
            ? {}
            : {
                watchHistory: [{ ...v, at: Date.now() }, ...s.watchHistory.filter((x) => x.id !== v.id)].slice(
                  0,
                  HISTORY_MAX,
                ),
              },
        ),
      removeFromHistory: (videoId) =>
        set((s) => ({ watchHistory: s.watchHistory.filter((x) => x.id !== videoId) })),
      clearHistory: () => set({ watchHistory: [] }),
      toggleWatchLater: (v) =>
        set((s) =>
          s.watchLater.some((x) => x.id === v.id)
            ? { watchLater: s.watchLater.filter((x) => x.id !== v.id) }
            : { watchLater: [{ ...v, at: Date.now() }, ...s.watchLater] },
        ),
      createPlaylist: (name) => {
        const id = makeId('pl');
        set((s) => ({
          playlists: [...s.playlists, { id, name: name.trim() || '새 재생목록', items: [], createdAt: Date.now() }],
        }));
        return id;
      },
      renamePlaylist: (id, name) =>
        set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)) })),
      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),
      togglePlaylistItem: (playlistId, v) =>
        set((s) => ({
          playlists: s.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const has = p.items.some((x) => x.id === v.id);
            return { ...p, items: has ? p.items.filter((x) => x.id !== v.id) : [...p.items, { ...v, at: Date.now() }] };
          }),
        })),

      introDone: false,
      setIntroDone: (v) => set({ introDone: v }),
      landingMode: 'home',
      openLanding: (mode) => set({ landingMode: mode, introDone: false }),
      signupInProgress: false,
      setSignupInProgress: (v) => set({ signupInProgress: v }),
      syncedUserId: null,
      setSyncedUserId: (id) => set({ syncedUserId: id }),
      syncStatus: 'off',
      lastSyncedAt: null,
      syncError: '',
      setSyncState: (patch) => set(patch),
      replaceData: (d) => set({ ...d }),

      addCategory: (name, emoji, color, parentId = null) => {
        const categories = get().categories;
        // 하위는 한 단계만: 하위의 하위를 만들려 하면 그 상위 아래에 둔다.
        const parent = parentId ? categories.find((c) => c.id === parentId) : undefined;
        const realParent = parent?.parentId ? parent.parentId : (parent?.id ?? null);
        const siblings = categories.filter((c) => (c.parentId ?? null) === realParent);
        const nextOrder = siblings.length === 0 ? 0 : Math.max(...siblings.map((c) => c.order)) + 1;
        const paletteIndex = categories.length;
        const newCategory: Category = {
          id: makeId('cat'),
          name: name.trim(),
          emoji: emoji ?? CategoryEmojis[paletteIndex % CategoryEmojis.length],
          color: color ?? CategoryColors[paletteIndex % CategoryColors.length],
          order: nextOrder,
          parentId: realParent,
        };
        set({ categories: [...categories, newCategory] });
        return newCategory.id;
      },

      updateCategory: (id, patch) => {
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...patch, name: patch.name?.trim() ?? c.name } : c,
          ),
        });
      },

      deleteCategory: (id) => {
        const categories = get().categories;
        const target = categories.find((c) => c.id === id);
        if (!target) return;
        if (target.parentId) {
          // 하위 분류함: 채널은 상위 분류함으로 올린다.
          const parentId = target.parentId;
          set({
            categories: categories.filter((c) => c.id !== id),
            channels: get().channels.map((ch) => (ch.categoryId === id ? { ...ch, categoryId: parentId } : ch)),
          });
          return;
        }
        // 최상위 분류함: 그 아래 하위 분류함도 함께 지우고, 채널은 모두 미분류로.
        const removed = new Set([id, ...categories.filter((c) => c.parentId === id).map((c) => c.id)]);
        set({
          categories: categories.filter((c) => !removed.has(c.id)),
          channels: get().channels.map((ch) =>
            ch.categoryId && removed.has(ch.categoryId) ? { ...ch, categoryId: null } : ch,
          ),
        });
      },

      importDemoChannels: () => {
        const classified = classifyChannels(MockChannels, get().categories);
        // 이미 있는 채널은 사용자가 옮겨둔 분류를 보존하고, 새 채널만 추가.
        const existing = new Map(get().channels.map((c) => [c.id, c]));
        const merged = classified.map((ch) => existing.get(ch.id) ?? ch);
        set({ channels: merged });
      },

      moveChannel: (channelId, categoryId) => {
        set({
          channels: get().channels.map((ch) =>
            ch.id === channelId ? { ...ch, categoryId } : ch,
          ),
        });
      },

      clearChannels: () =>
        set({
          channels: [],
          recentVideos: {},
          lastCheckedAt: null,
          baselineAt: null,
          seenAt: {},
          channelAlerts: {},
          alertFiredAt: {},
        }),

      restoreBackup: (b) => {
        // 가져온 알림은 '지금 막 저장한 것'으로 쳐서, 지난 알림 시각이 한꺼번에 울리지 않게 한다.
        const now = Date.now();
        const alertFiredAt: Record<string, number> = {};
        for (const id of Object.keys(b.channelAlerts)) alertFiredAt[id] = now;
        set({
          categories: b.categories,
          channels: b.channels,
          channelAlerts: b.channelAlerts,
          alertFiredAt,
          recentVideos: b.recentVideos,
          lastCheckedAt: b.lastCheckedAt,
          // 원래 곳에서 본 시각을 그대로 옮긴다. 그 정보가 없는 파일이면 가져온 영상은 모두 '본 것'으로 친다
          // (그러지 않으면 예전 기준 시각 이후 영상이 전부 NEW 로 쏟아진다).
          baselineAt:
            Object.keys(b.seenAt).length > 0
              ? b.baselineAt
              : Math.max(b.baselineAt ?? 0, b.lastCheckedAt ?? 0) || null,
          seenAt: b.seenAt,
        });
      },

      // 전체 초기화: 이 기기(브라우저)에 저장된 유튜브 로그인 토큰·API 키·클라이언트 정보까지 지운다.
      resetAll: () =>
        set({
          categories: DefaultCategories,
          channels: [],
          recentVideos: {},
          lastCheckedAt: null,
          baselineAt: null,
          seenAt: {},
          channelAlerts: {},
          alertFiredAt: {},
          youtubeConnected: false,
          accessToken: null,
          tokenExpiresAt: null,
          youtubeApiKey: '',
          googleClientId: '',
          googleClientSecret: '',
        }),
    }),
    {
      name: 'favorit-youtube-store',
      storage: createJSONStorage(() => AsyncStorage),
      // hydrated / setHydrated 는 저장하지 않는다 (런타임 상태).
      partialize: (state) => ({
        categories: state.categories,
        channels: state.channels,
        googleClientId: state.googleClientId,
        googleClientSecret: state.googleClientSecret,
        youtubeConnected: state.youtubeConnected,
        youtubeApiKey: state.youtubeApiKey,
        accessToken: state.accessToken,
        tokenExpiresAt: state.tokenExpiresAt,
        recentVideos: state.recentVideos,
        lastCheckedAt: state.lastCheckedAt,
        baselineAt: state.baselineAt,
        seenAt: state.seenAt,
        channelAlerts: state.channelAlerts,
        alertFiredAt: state.alertFiredAt,
        watchHistory: state.watchHistory,
        watchLater: state.watchLater,
        playlists: state.playlists,
        adminSettings: state.adminSettings,
        adminPinHash: state.adminPinHash,
        usage: state.usage,
        introDone: state.introDone,
        syncedUserId: state.syncedUserId,
      }),
      version: 1,
      // v1: Claude 가 검토한 채널 분류를 한 번 적용 (없는 채널·분류함은 건드리지 않음).
      migrate: (persisted, version) => {
        const s = persisted as Partial<AppState>;
        if (version < 1 && s.channels && s.categories) {
          const catIds = new Set(s.categories.map((c) => c.id));
          s.channels = s.channels.map((ch) => {
            if (!(ch.id in ManualClassification)) return ch;
            const target = ManualClassification[ch.id];
            return target === null || catIds.has(target) ? { ...ch, categoryId: target } : ch;
          });
        }
        return s as AppState;
      },
      // 저장된 관리자 설정에 새로 생긴 항목이 없으면 기본값으로 채운다.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          // 형식이 틀린 API 키(예: 클라이언트 ID)는 버린다 — 남아 있으면 모든 영상 조회가 실패한다.
          youtubeApiKey: isValidYouTubeApiKey(p.youtubeApiKey) ? p.youtubeApiKey!.trim() : '',
          adminSettings: {
            ...DefaultAdminSettings,
            ...p.adminSettings,
            // 예전 기본값 'qwen3.8:27b' → Ollama 설치 이름과 맞춘 'qwen3.8'
            ...(p.adminSettings?.aiModel === 'qwen3.8:27b' ? { aiModel: 'qwen3.8' } : {}),
            apps: { ...DefaultAdminSettings.apps, ...p.adminSettings?.apps },
          },
        };
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
