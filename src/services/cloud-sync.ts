/**
 * 클라우드(Supabase) 동기화 — 로그인한 회원의 분류함 · 채널 · 알림 · 환경 설정을 DB 에 기억한다.
 *
 * 규칙
 * - 처음 로그인(이 기기가 아직 어떤 계정과도 동기화된 적 없음): 이 기기 데이터와 클라우드 데이터를 합친다
 *   (같은 항목은 클라우드 우선). → 가입 전에 쓰던 데이터가 그대로 계정으로 옮겨진다.
 * - 같은 계정으로 다시 열기: 클라우드가 기준 (다른 기기에서 바꾼 내용이 반영된다).
 * - 다른 계정으로 로그인: 이전 계정 데이터는 섞지 않고 그 계정의 클라우드 데이터로 바꾼다.
 * - 이후 이 기기에서 바꾸면 1.5초 뒤 바뀐 행만 올린다.
 * 액세스 토큰·알림 발송 기록처럼 기기에만 의미 있는 값은 올리지 않는다.
 */
import { AppState, Platform } from 'react-native';

import { DefaultCategories } from '@/constants/categories';
import { requireSupabase } from '@/services/supabase';
import { useStore } from '@/store/store';
import { Category, Channel, ChannelAlert } from '@/types';

type Row = Record<string, unknown>;
type Table = 'categories' | 'channels' | 'channel_alerts';

const PUSH_DELAY_MS = 1500;
const CHUNK = 500;

// ---------- 행 ↔ 앱 데이터 ----------
const categoryRow = (uid: string, c: Category): Row => ({
  user_id: uid,
  id: c.id,
  name: c.name,
  emoji: c.emoji,
  color: c.color,
  sort_order: c.order,
  parent_id: c.parentId ?? null,
  keywords: c.keywords ?? null,
});
const toCategory = (r: Row): Category => ({
  id: String(r.id),
  name: String(r.name),
  emoji: String(r.emoji ?? '📁'),
  color: String(r.color),
  order: Number(r.sort_order ?? 0),
  parentId: (r.parent_id as string | null) ?? null,
  keywords: (r.keywords as string[] | null) ?? undefined,
});
const channelRow = (uid: string, c: Channel): Row => ({
  user_id: uid,
  id: c.id,
  title: c.title,
  description: c.description ?? '',
  thumbnail: c.thumbnail ?? null,
  subscriber_count: c.subscriberCount ?? null,
  category_id: c.categoryId,
});
const toChannel = (r: Row): Channel => ({
  id: String(r.id),
  title: String(r.title),
  description: String(r.description ?? ''),
  thumbnail: (r.thumbnail as string | null) ?? undefined,
  subscriberCount: r.subscriber_count == null ? undefined : Number(r.subscriber_count),
  categoryId: (r.category_id as string | null) ?? null,
});
const alertRow = (uid: string, channelId: string, a: ChannelAlert): Row => ({
  user_id: uid,
  channel_id: channelId,
  freq: a.freq,
  hour: a.hour,
  minute: a.minute,
  weekday: a.weekday,
  month_day: a.monthDay,
});
const toAlert = (r: Row): ChannelAlert => ({
  freq: r.freq as ChannelAlert['freq'],
  hour: Number(r.hour),
  minute: Number(r.minute),
  weekday: Number(r.weekday ?? 1),
  monthDay: Number(r.month_day ?? 1),
});

/** 지금 기기 상태를 테이블별 행(키 → 행)으로. */
function snapshot(uid: string) {
  const s = useStore.getState();
  return {
    categories: new Map(s.categories.map((c) => [c.id, categoryRow(uid, c)])),
    channels: new Map(s.channels.map((c) => [c.id, channelRow(uid, c)])),
    channel_alerts: new Map(Object.entries(s.channelAlerts).map(([id, a]) => [id, alertRow(uid, id, a)])),
    settings: {
      user_id: uid,
      google_client_id: s.googleClientId || null,
      youtube_connected: s.youtubeConnected,
      baseline_at: s.baselineAt,
      last_checked_at: s.lastCheckedAt,
      seen_at: s.seenAt,
      prefs: { youtubeApiKey: s.youtubeApiKey || null },
    } as Row,
  };
}

/** 마지막으로 올린 내용 (행 키 → JSON). 바뀐 행만 올리기 위해 기억한다. */
let pushed: { uid: string; tables: Record<Table, Map<string, string>>; settings: string } | null = null;

function remember(uid: string, snap: ReturnType<typeof snapshot>) {
  const json = (m: Map<string, Row>) => new Map([...m].map(([k, v]) => [k, JSON.stringify(v)]));
  pushed = {
    uid,
    tables: { categories: json(snap.categories), channels: json(snap.channels), channel_alerts: json(snap.channel_alerts) },
    settings: JSON.stringify(snap.settings),
  };
}

const KEY_COLUMN: Record<Table, string> = { categories: 'id', channels: 'id', channel_alerts: 'channel_id' };

async function fetchAll(table: string): Promise<Row[]> {
  const sb = requireSupabase();
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select('*').range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) return out;
  }
}

/** 바뀐 행만 올리고, 기기에서 지운 행은 클라우드에서도 지운다. */
export async function pushChanges(uid: string): Promise<void> {
  const sb = requireSupabase();
  const snap = snapshot(uid);
  const prev = pushed && pushed.uid === uid ? pushed : null;
  const now = new Date().toISOString();

  for (const table of ['categories', 'channels', 'channel_alerts'] as Table[]) {
    const rows = snap[table];
    const before = prev?.tables[table] ?? new Map<string, string>();
    const changed = [...rows].filter(([k, r]) => before.get(k) !== JSON.stringify(r)).map(([, r]) => ({ ...r, updated_at: now }));
    const removed = [...before.keys()].filter((k) => !rows.has(k));
    for (let i = 0; i < changed.length; i += CHUNK) {
      const { error } = await sb
        .from(table)
        .upsert(changed.slice(i, i + CHUNK), { onConflict: `user_id,${KEY_COLUMN[table]}` });
      if (error) throw error;
    }
    for (let i = 0; i < removed.length; i += CHUNK) {
      const { error } = await sb
        .from(table)
        .delete()
        .eq('user_id', uid)
        .in(KEY_COLUMN[table], removed.slice(i, i + CHUNK));
      if (error) throw error;
    }
  }
  if (!prev || prev.settings !== JSON.stringify(snap.settings)) {
    const { error } = await sb.from('user_settings').upsert({ ...snap.settings, updated_at: now }, { onConflict: 'user_id' });
    if (error) throw error;
  }
  remember(uid, snap);
}

/** 로그인 직후 한 번: 클라우드와 기기 데이터를 맞춘다 (규칙은 파일 맨 위 설명). */
export async function initialSync(uid: string): Promise<void> {
  const sb = requireSupabase();
  const [cats, chs, als, settingsRes] = await Promise.all([
    fetchAll('categories'),
    fetchAll('channels'),
    fetchAll('channel_alerts'),
    sb.from('user_settings').select('*').maybeSingle(),
  ]);
  if (settingsRes.error) throw settingsRes.error;
  const cloudSettings = (settingsRes.data ?? {}) as Row;

  const local = useStore.getState();
  const firstAdoption = local.syncedUserId === null;
  const cloudEmpty = cats.length === 0 && chs.length === 0;

  const cloud = {
    categories: cats.map(toCategory),
    channels: chs.map(toChannel),
    alerts: Object.fromEntries(als.map((r) => [String(r.channel_id), toAlert(r)])) as Record<string, ChannelAlert>,
  };

  let categories: Category[];
  let channels: Channel[];
  let channelAlerts: Record<string, ChannelAlert>;
  if (firstAdoption && !cloudEmpty) {
    // 이미 클라우드에 구성해 둔 계정 데이터가 있는 경우:
    // 새 기기의 기본 샘플/임시 데이터를 섞지 않고, 클라우드의 구성을 온전히 그대로 가져온다.
    categories = cloud.categories;
    channels = cloud.channels;
    channelAlerts = cloud.alerts;
  } else if (firstAdoption && cloudEmpty) {
    // 최초 가입 직후 첫 기기 동기화: 이 기기의 초기 데이터를 클라우드에 등록한다.
    categories = local.categories;
    channels = local.channels;
    channelAlerts = local.channelAlerts;
  } else if (cloudEmpty && local.syncedUserId === uid) {
    // 같은 계정인데 클라우드가 비었다 → 이 기기 것을 다시 올린다.
    categories = local.categories;
    channels = local.channels;
    channelAlerts = local.channelAlerts;
  } else {
    // 이미 동기화된 기기 또는 재접속: 클라우드 기준으로 맞춤
    categories = cloudEmpty ? DefaultCategories : cloud.categories;
    channels = cloud.channels;
    channelAlerts = cloud.alerts;
  }

  const prefs = (cloudSettings.prefs ?? {}) as { youtubeApiKey?: string | null };
  const sameOrFirst = firstAdoption || local.syncedUserId === uid;
  useStore.getState().replaceData({
    categories,
    channels,
    channelAlerts,
    googleClientId: (cloudSettings.google_client_id as string) || (sameOrFirst ? local.googleClientId : ''),
    youtubeConnected: Boolean(cloudSettings.youtube_connected) || (sameOrFirst && local.youtubeConnected),
    seenAt: { ...(sameOrFirst ? local.seenAt : {}), ...((cloudSettings.seen_at as Record<string, number>) ?? {}) },
    baselineAt: (cloudSettings.baseline_at as number | null) ?? (sameOrFirst ? local.baselineAt : null),
    lastCheckedAt: (cloudSettings.last_checked_at as number | null) ?? (sameOrFirst ? local.lastCheckedAt : null),
  });
  if (prefs.youtubeApiKey && !useStore.getState().youtubeApiKey) {
    useStore.getState().setYoutubeApiKey(prefs.youtubeApiKey);
  }
  if (!sameOrFirst) {
    // 다른 계정의 기기 전용 기록(최신 영상·알림 발송 기록)은 지운다.
    useStore.setState({ recentVideos: {}, alertFiredAt: {} });
  }
  useStore.getState().setSyncedUserId(uid);

  // 클라우드에 이미 있는 행은 '올린 것'으로 두고, 합치면서 생긴 차이만 올린다.
  const cloudSnap = {
    categories: new Map(cats.map((r) => [String(r.id), categoryRow(uid, toCategory(r))])),
    channels: new Map(chs.map((r) => [String(r.id), channelRow(uid, toChannel(r))])),
    channel_alerts: new Map(als.map((r) => [String(r.channel_id), alertRow(uid, String(r.channel_id), toAlert(r))])),
    settings: {} as Row,
  };
  remember(uid, cloudSnap);
  await pushChanges(uid);

  // 회원 정보: 마지막 접속 시각
  await sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', uid);
}

/** 이후 기기에서 바뀌는 내용을 자동으로 올린다. 멈추는 함수를 돌려준다. */
export function startAutoSync(uid: string): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let again = false;

  const flush = async () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    useStore.getState().setSyncState({ syncStatus: 'syncing' });
    try {
      await pushChanges(uid);
      useStore.getState().setSyncState({ syncStatus: 'synced', lastSyncedAt: Date.now(), syncError: '' });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      useStore.getState().setSyncState({ syncStatus: 'error', syncError: message });
    } finally {
      running = false;
      if (again) {
        again = false;
        schedule();
      }
    }
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, PUSH_DELAY_MS);
  };

  const unsubscribe = useStore.subscribe((s, p) => {
    if (
      s.categories !== p.categories ||
      s.channels !== p.channels ||
      s.channelAlerts !== p.channelAlerts ||
      s.googleClientId !== p.googleClientId ||
      s.youtubeConnected !== p.youtubeConnected ||
      s.youtubeApiKey !== p.youtubeApiKey ||
      s.seenAt !== p.seenAt ||
      s.baselineAt !== p.baselineAt ||
      s.lastCheckedAt !== p.lastCheckedAt
    ) {
      schedule();
    }
  });

  // 다른 기기(PC/스마트폰/태블릿)에서 수정한 내용을 즉시 반영하기 위한 포커스/활성화 감지
  const onFocusOrActive = () => {
    if (!running) {
      initialSync(uid).catch(() => {});
    }
  };

  let appStateSub: { remove: () => void } | null = null;
  if (Platform.OS !== 'web') {
    appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onFocusOrActive();
    });
  } else if (typeof window !== 'undefined') {
    window.addEventListener('focus', onFocusOrActive);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') onFocusOrActive();
      });
    }
  }

  // Supabase 실시간 변경 구독 (어느 기기에서든 수정 즉시 다른 기기에 실시간 반영)
  let realtimeChannel: any = null;
  try {
    const sb = requireSupabase();
    realtimeChannel = sb
      .channel(`sync-realtime-${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${uid}` },
        () => {
          if (!running) {
            initialSync(uid).catch(() => {});
          }
        },
      )
      .subscribe();
  } catch {}

  return () => {
    unsubscribe();
    if (timer) clearTimeout(timer);
    appStateSub?.remove?.();
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onFocusOrActive);
    }
    if (realtimeChannel) {
      try {
        const sb = requireSupabase();
        sb.removeChannel(realtimeChannel);
      } catch {}
    }
  };
}

/** 로그아웃 등으로 동기화를 멈출 때 '올린 기록'도 잊는다. */
export function resetSyncMemory(): void {
  pushed = null;
}
